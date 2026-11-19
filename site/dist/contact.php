<?php
// Contact form handler for cPanel hosting. No database; sends one email per submission.
// Set TWD_CONTACT_TO in cPanel (or edit the fallback below) to the inbox that should receive leads.

$to = getenv('TWD_CONTACT_TO') ?: 'hello@tucsonwebdevelopment.net';
$from = 'website@tucsonwebdevelopment.net'; // must be a mailbox on this domain for SPF/DKIM to pass

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: /contact/', true, 303);
    exit;
}

function field(string $key, int $max): string {
    $v = isset($_POST[$key]) ? trim((string) $_POST[$key]) : '';
    $v = str_replace(["\r", "\0"], '', $v);
    return mb_substr($v, 0, $max);
}

// Spam checks: honeypot must be empty, and the form must have been open at least 3 seconds.
$honeypot = field('company', 200);
$ts = (int) field('ts', 20);
$age = time() - $ts;
if ($honeypot !== '' || $ts === 0 || $age < 3 || $age > 86400) {
    // Pretend success so bots learn nothing.
    header('Location: /thanks/', true, 303);
    exit;
}

$name    = field('name', 120);
$email   = field('email', 200);
$phone   = field('phone', 40);
$sms_ok  = field('sms_ok', 5) === 'yes' ? 'Yes' : 'No';
$website = field('website', 200);
$package = field('package', 60);
$details = field('details', 5000);

if ($name === '' || $details === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><meta charset="utf-8"><title>Check the form</title>'
       . '<p style="font-family:sans-serif;max-width:36rem;margin:3rem auto">'
       . 'The form needs your name, a valid email address, and a short message. '
       . '<a href="javascript:history.back()">Go back and fix it</a>.</p>';
    exit;
}

$name_header = preg_replace('/[^\p{L}\p{N} .\'-]/u', '', $name);
$subject = 'New website inquiry: ' . $name_header . ($package ? " ($package)" : '');
$body = "Name: $name\nEmail: $email\nPhone: $phone\nOK to text: $sms_ok\nWebsite: $website\nPackage: $package\n\n$details\n\n--\nSent from tucsonwebdevelopment.net/contact/ at " . date('Y-m-d H:i:s T') . "\n";

$headers = [
    'From' => "Tucson Web Development <$from>",
    'Reply-To' => $email,
    'Content-Type' => 'text/plain; charset=utf-8',
    'X-Mailer' => 'twd-contact',
];

$sent = mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers, '-f' . $from);

if (!$sent) {
    http_response_code(500);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><meta charset="utf-8"><title>Message not sent</title>'
       . '<p style="font-family:sans-serif;max-width:36rem;margin:3rem auto">'
       . 'Your message couldn\'t be sent because of a server error. Please call (520) 999-7374 instead.</p>';
    exit;
}

header('Location: /thanks/', true, 303);
