<?php
// Chat endpoint for the site's own assistant (the Starter chatbot package).
// The browser POSTs {"messages":[{"role":"user","content":"..."}, ...]} and gets {"reply":"..."}.
//
// One-time server setup (outside the web root, so nothing secret is in the public repo):
//   /home/freedmou/twd-chat/vendor/       composer require anthropic-ai/sdk   (run in that folder)
//   /home/freedmou/twd-chat/config.php    <?php return ['api_key' => 'sk-ant-...'];
// The system prompt is /chat-knowledge.txt, built from src/data/chatbot.ts.

declare(strict_types=1);

use Anthropic\Client;
use Anthropic\Core\Exceptions\APIConnectionException;
use Anthropic\Core\Exceptions\APIStatusException;
use Anthropic\Core\Exceptions\RateLimitException;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const PRIVATE_DIR = __DIR__ . '/../twd-chat';
const MODEL = 'claude-opus-5-5';
const MAX_TURNS = 12;          // messages kept from the conversation
const MAX_CHARS = 800;         // per visitor message
const PER_IP_PER_HOUR = 30;
const SITE_PER_DAY = 600;      // hard ceiling on API spend
const FALLBACK = "Sorry, I can't answer right now. Please use the contact form at tucsonwebdevelopment.net/contact/ or call (520) 999-7374.";

function reply(int $status, string $text): never {
    http_response_code($status);
    echo json_encode(['reply' => $text], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    reply(405, 'Use POST.');
}

// Only accept requests from this site's own pages.
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== ($_SERVER['HTTP_HOST'] ?? '')) {
    reply(403, 'Forbidden.');
}

// --- Validate the conversation -------------------------------------------------
$body = json_decode((string) file_get_contents('php://input', false, null, 0, 64000), true);
$raw = is_array($body) && isset($body['messages']) && is_array($body['messages']) ? $body['messages'] : [];
$raw = array_slice($raw, -MAX_TURNS);

$messages = [];
foreach ($raw as $m) {
    $role = $m['role'] ?? '';
    $content = is_string($m['content'] ?? null) ? trim(str_replace("\0", '', $m['content'])) : '';
    if (!in_array($role, ['user', 'assistant'], true) || $content === '') {
        continue;
    }
    $content = mb_substr($content, 0, $role === 'user' ? MAX_CHARS : 4000);
    $last = count($messages) - 1;
    if ($last >= 0 && $messages[$last]['role'] === $role) {
        $messages[$last]['content'] .= "\n\n" . $content; // merge same-role turns
    } else {
        $messages[] = ['role' => $role, 'content' => $content];
    }
}
while ($messages && $messages[0]['role'] !== 'user') {
    array_shift($messages);
}
if (!$messages || end($messages)['role'] !== 'user') {
    reply(400, 'Please type a question.');
}

// --- Rate limits (per IP per hour, and for the whole site per day) ----------------
function over_limit(string $file, string $key, int $limit, int $window): bool {
    $fh = fopen($file, 'c+');
    if (!$fh) {
        return false;
    }
    flock($fh, LOCK_EX);
    $data = json_decode(stream_get_contents($fh) ?: '{}', true) ?: [];
    $now = time();
    foreach ($data as $k => $hits) {
        $data[$k] = array_values(array_filter($hits, fn ($t) => $t > $now - $window));
        if (!$data[$k]) {
            unset($data[$k]);
        }
    }
    $blocked = count($data[$key] ?? []) >= $limit;
    if (!$blocked) {
        $data[$key][] = $now;
    }
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($data));
    flock($fh, LOCK_UN);
    fclose($fh);
    return $blocked;
}

if (!is_dir(PRIVATE_DIR) || !is_file(PRIVATE_DIR . '/vendor/autoload.php') || !is_file(PRIVATE_DIR . '/config.php')) {
    error_log('twd-chat: missing ' . PRIVATE_DIR . ' setup');
    reply(503, FALLBACK);
}

$ipKey = hash('sha256', $_SERVER['REMOTE_ADDR'] ?? 'unknown');
if (over_limit(PRIVATE_DIR . '/rate-ip.json', $ipKey, PER_IP_PER_HOUR, 3600)) {
    reply(429, "You've sent a lot of messages. Please try again in a bit, or call (520) 999-7374.");
}
if (over_limit(PRIVATE_DIR . '/rate-site.json', 'all', SITE_PER_DAY, 86400)) {
    reply(429, FALLBACK);
}

// --- Ask Claude -----------------------------------------------------------------
$system = @file_get_contents(__DIR__ . '/chat-knowledge.txt');
if (!$system) {
    error_log('twd-chat: chat-knowledge.txt not found');
    reply(503, FALLBACK);
}

require PRIVATE_DIR . '/vendor/autoload.php';
$config = require PRIVATE_DIR . '/config.php';

try {
    $client = new Client(apiKey: $config['api_key']);
    $message = $client->messages->create(
        model: MODEL,
        maxTokens: 4000,
        outputConfig: ['effort' => 'low'],
        system: [
            ['type' => 'text', 'text' => $system, 'cacheControl' => ['type' => 'ephemeral']],
        ],
        messages: $messages,
    );
} catch (RateLimitException $e) {
    error_log('twd-chat: rate limited by API');
    reply(503, FALLBACK);
} catch (APIStatusException $e) {
    error_log('twd-chat: API error ' . ($e->type?->value ?? '') . ' ' . $e->getMessage());
    reply(502, FALLBACK);
} catch (APIConnectionException $e) {
    error_log('twd-chat: connection error ' . $e->getMessage());
    reply(502, FALLBACK);
}

if ($message->stopReason === 'refusal') {
    reply(200, "I can only help with questions about Tucson Web Development's services and pricing.");
}

$text = '';
foreach ($message->content as $block) {
    if ($block->type === 'text') {
        $text .= $block->text;
    }
}
reply(200, trim($text) !== '' ? trim($text) : FALLBACK);
