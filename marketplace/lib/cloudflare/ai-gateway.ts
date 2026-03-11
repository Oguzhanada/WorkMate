/**
 * Cloudflare AI Gateway — Anthropic client factory
 *
 * Routes Anthropic API calls through Cloudflare AI Gateway for:
 * - Request/response logging and observability
 * - Prompt caching (reduces cost for repeated prompts)
 * - Rate limiting and abuse protection at the gateway layer
 * - Fallback / provider routing (future)
 *
 * Env vars:
 *   CLOUDFLARE_AI_GATEWAY_URL — e.g. https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_name}/anthropic
 *
 * If CLOUDFLARE_AI_GATEWAY_URL is not set, falls back to the default Anthropic endpoint.
 * This means the gateway is opt-in and the app works without it.
 *
 * Dashboard: dash.cloudflare.com → AI → AI Gateway
 */

import Anthropic from '@anthropic-ai/sdk';

let _client: Anthropic | null = null;

/**
 * Returns a singleton Anthropic client.
 * If CLOUDFLARE_AI_GATEWAY_URL is set, the client routes through the gateway.
 * Otherwise it uses the standard Anthropic endpoint.
 */
export function getAnthropicClient(): Anthropic {
  if (_client) return _client;

  const gatewayUrl = process.env.CLOUDFLARE_AI_GATEWAY_URL;
  const apiKey = process.env.ANTHROPIC_API_KEY;

  _client = new Anthropic({
    apiKey,
    ...(gatewayUrl ? { baseURL: gatewayUrl } : {}),
  });

  return _client;
}
