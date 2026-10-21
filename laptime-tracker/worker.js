import page from './index.html';

export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Serve the app at the root and at /index.html.
    if (url.pathname === '/' || url.pathname === '/index.html') {
      return new Response(page, {
        headers: {
          'content-type': 'text/html; charset=utf-8',
          // The app is one file; cache it but revalidate so updates land.
          'cache-control': 'public, max-age=0, must-revalidate',
          'x-content-type-options': 'nosniff',
          'referrer-policy': 'no-referrer',
          // Everything is inlined, so lock the page down hard.
          // 'unsafe-inline' is required for the inline <style> and <script>.
          'content-security-policy':
            "default-src 'none'; " +
            "style-src 'unsafe-inline'; " +
            "script-src 'unsafe-inline'; " +
            "img-src data:; " +
            "connect-src 'none'; " +
            "base-uri 'none'; " +
            "form-action 'none'; " +
            "frame-ancestors 'none'",
        },
      });
    }

    // No other routes exist. Anything else is a 404.
    return new Response('Not found', {
      status: 404,
      headers: { 'content-type': 'text/plain; charset=utf-8' },
    });
  },
};
