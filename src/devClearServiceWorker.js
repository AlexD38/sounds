/**
 * Dev-only: kill leftover PWA service workers / Workbox caches.
 * A previous `vite preview` or install can leave a SW that keeps serving
 * an old build even after Shift+R on `npm run dev`.
 */
export async function clearDevServiceWorkers() {
  if (!import.meta.env.DEV) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map(reg => reg.unregister()));
  } catch (err) {
    console.warn('[dev] Failed to unregister service workers', err);
  }

  if (!('caches' in window)) return;

  try {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(
          key =>
            key.startsWith('workbox-') ||
            key.includes('precache') ||
            key === 'aa-sound-library'
        )
        .map(key => caches.delete(key))
    );
  } catch (err) {
    console.warn('[dev] Failed to clear Cache Storage', err);
  }
}
