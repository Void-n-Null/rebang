/**
 * ReBang Edge Redirect Worker
 * 
 * Intercepts requests with ?q= parameter and performs instant redirects
 * at the edge. Non-redirect requests are passed through to the origin (Vercel).
 * 
 * Custom bangs (stored in user's localStorage) are NOT handled here - they
 * fall through to the origin where the React app handles them.
 */

import { triggerMap } from './bangs';

interface Env {
  ORIGIN_URL: string;
}

const ORIGIN = 'https://www.rebang.online';

/**
 * Parse the `rebang_cb` cookie (set by the client in
 * `src/utils/settings.ts::syncCustomBangsCookie`) into a Set of lowercase
 * trigger strings the user has defined as custom bangs.
 *
 * The worker MUST defer to the origin/client for any trigger in this set --
 * otherwise a user's custom `!gl` (e.g. a private GitLab) gets clobbered by
 * the public top-bang of the same trigger at the edge. (GH #20)
 */
function getCustomBangTriggers(request: Request): Set<string> {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return new Set();

  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const name = part.slice(0, eq).trim();
    if (name !== 'rebang_cb') continue;
    const raw = part.slice(eq + 1).trim();
    if (!raw) return new Set();
    try {
      return new Set(
        decodeURIComponent(raw)
          .split(',')
          .map(s => s.trim().toLowerCase())
          .filter(Boolean)
      );
    } catch {
      return new Set();
    }
  }
  return new Set();
}

/**
 * Pass request through to Vercel origin
 */
function passToOrigin(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const originUrl = new URL(url.pathname + url.search, ORIGIN);
  
  return fetch(originUrl.toString(), {
    method: request.method,
    headers: request.headers,
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    // No query parameter - pass through to origin for the React app
    if (!query) {
      return passToOrigin(request);
    }

    // Extract bang from query (e.g., "cats !yt" -> "yt").
    // Require start-of-string or whitespace before `!` so tokens like
    // "Wacatac.B!ml" don't accidentally trigger a bang. (GH #27)
    const bangMatch = query.match(/(?:^|\s)!(\S+)/i);
    
    // No bang in query - pass to origin so client can use user's configured default
    if (!bangMatch) {
      return passToOrigin(request);
    }
    
    const bangTrigger = bangMatch[1].toLowerCase();

    // If the user has a custom bang with this trigger, defer to the origin
    // so the React app can apply the override from localStorage. (GH #20)
    const customTriggers = getCustomBangTriggers(request);
    if (customTriggers.has(bangTrigger)) {
      return passToOrigin(request);
    }

    // Look up bang in our trigger map (O(1) lookup)
    const bang = triggerMap.get(bangTrigger);

    if (!bang) {
      // Bang not found in top bangs - fall back to origin
      // This handles: uncommon bangs, custom user bangs, typos
      return passToOrigin(request);
    }

    // Remove bang from query to get clean search term. Lookbehind so the
    // leading whitespace before `!foo` is preserved (otherwise "cats !yt foo"
    // would collapse to "catsfoo").
    const cleanQuery = query.replace(/(?<=^|\s)!\S+\s*/i, '').trim();

    // If just a bang and no search term, redirect to the site's base domain
    // instead of producing an empty-results URL like
    // `youtube.com/results?search_query=`. (GH #82, #90, #129, #56)
    if (!cleanQuery) {
      try {
        const baseDomain = new URL(bang.u).origin;
        return Response.redirect(baseDomain, 302);
      } catch {
        // Fall through to template substitution if the bang URL is malformed
      }
    }

    // Build the redirect URL
    const redirectUrl = bang.u.replace(/%s/g, encodeURIComponent(cleanQuery));

    // Return 302 redirect
    return Response.redirect(redirectUrl, 302);
  },
};
