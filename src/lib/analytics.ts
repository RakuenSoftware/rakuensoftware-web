const VISITOR_KEY = 'rakuen.analytics.visitor';
const SESSION_KEY = 'rakuen.analytics.session';

function identifier(storage: Storage, key: string): string {
  const existing = storage.getItem(key);
  if (existing != null) return existing;

  const created = crypto.randomUUID();
  storage.setItem(key, created);
  return created;
}

/** Record a page view without cookies or third-party scripts. */
export function trackPageView(path: string): void {
  if (import.meta.env.DEV && import.meta.env.VITE_ANALYTICS_ENABLED !== 'true') return;
  if (navigator.doNotTrack === '1') return;

  try {
    const url = new URL(window.location.href);
    const payload = JSON.stringify({
      visitorId: identifier(localStorage, VISITOR_KEY),
      sessionId: identifier(sessionStorage, SESSION_KEY),
      path,
      referrer: document.referrer,
      source: url.searchParams.get('utm_source'),
      campaign: url.searchParams.get('utm_campaign'),
      screenWidth: window.innerWidth,
    });

    if (navigator.sendBeacon != null) {
      const queued = navigator.sendBeacon('/__analytics/pageview', new Blob([payload], { type: 'application/json' }));
      if (queued) return;
    }

    void fetch('/__analytics/pageview', {
      method: 'POST',
      body: payload,
      headers: { 'content-type': 'application/json' },
      keepalive: true,
    });
  } catch {
    // Analytics must never interfere with the public site. Storage can be
    // unavailable in privacy modes, so failure is intentionally silent.
  }
}
