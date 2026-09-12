/**
 * Cloudflare Web Analytics.
 *
 * Loaded only in production builds. The site token is bound to the published
 * origin (sysper.github.io), so on localhost the beacon's preflight is
 * rejected and the dev console fills with CORS errors for data Cloudflare
 * would discard anyway:
 *
 *   Access to resource at 'https://cloudflareinsights.com/cdn-cgi/rum' from
 *   origin 'http://localhost:5173' has been blocked by CORS policy
 *
 * Injecting it here instead of hard-coding it in index.html keeps development
 * quiet without changing what ships.
 */
const TOKEN = 'df180b2ab1724453a46a74967c535da9';

export function loadAnalytics(): void {
  if (!import.meta.env.PROD) return;
  const s = document.createElement('script');
  s.defer = true;
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  // The beacon reads its own tag through document.currentScript, which is set
  // for dynamically inserted classic scripts.
  s.setAttribute('data-cf-beacon', JSON.stringify({ token: TOKEN }));
  document.head.appendChild(s);
}
