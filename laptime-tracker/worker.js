import page from './index.html';
import { InputError, readBody, readState, validateState, writeState } from './storage.js';

const headers = {
  'cache-control': 'private, no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer'
};

function json(value, status = 200) {
  return Response.json(value, { status, headers });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    try {
      if (!ctx.access || !env.OWNER_EMAIL) return json({ error: 'Sign in through Cloudflare Access to open your lap tracker.' }, 401);
      const identity = await ctx.access.getIdentity();
      if (identity?.email?.toLowerCase() !== env.OWNER_EMAIL.toLowerCase()) return json({ error: 'This tracker is private.' }, 403);
      if (!env.DB) return json({ error: 'Cloud database is not configured.' }, 503);

      if (url.pathname === '/api/state') {
        if (request.method === 'GET') return json(await readState(env.DB));
        if (request.method !== 'PUT') return json({ error: 'Use GET or PUT.' }, 405);
        const origin = request.headers.get('origin');
        if ((origin && origin !== url.origin) || request.headers.get('sec-fetch-site') === 'cross-site') return json({ error: 'Cross-origin writes are not allowed.' }, 403);
        const body = await readBody(request);
        const state = validateState(body.state);
        const revision = await writeState(env.DB, state, body.revision);
        if (revision === null) return json({ error: 'Your record changed on another device. Back up your local changes, then reload the cloud record.' }, 409);
        return json({ revision });
      }

      if ((url.pathname === '/' || url.pathname === '/index.html') && request.method === 'GET') {
        return new Response(page.replace('<html lang="en">', '<html lang="en" data-cloud-storage="d1">'), {
          headers: {
            ...headers,
            'content-type': 'text/html; charset=utf-8',
            'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
          }
        });
      }
      return json({ error: 'Not found' }, 404);
    } catch (error) {
      if (error instanceof InputError) return json({ error: error.message }, 400);
      console.error(JSON.stringify({ event: 'storage_error', path: url.pathname, type: error?.name || 'Error' }));
      return json({ error: 'Cloud storage is unavailable. Keep your local backup and try again.' }, 503);
    }
  },
};
