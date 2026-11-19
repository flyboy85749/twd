// Builds /chat-knowledge.txt, the system prompt that public/chat.php sends to Claude.
import type { APIRoute } from 'astro';
import { chatPrompt } from '../data/chatbot';

export const GET: APIRoute = () =>
  new Response(chatPrompt, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
