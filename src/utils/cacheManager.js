import localforage from 'localforage';

const decodedCache = new Map(); // RAM: cacheKey -> AudioBuffer
const audioStore = localforage.createInstance({ name: 'aa-audio-cache' });

function cacheKeyFromUrl(url) {
  if (!url) return null;
  try {
    const u = new URL(url, window.location.origin);
    return u.pathname + u.search;
  } catch {
    return url;
  }
}

async function fetchArrayBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch audio (${response.status})`);
  }
  return response.arrayBuffer();
}

export const cacheManager = {
  /**
   * Load + decode audio by URL. Persists ArrayBuffer in IndexedDB for offline reuse.
   * Skip persistent cache for cross-origin URLs (API previews) — RAM only.
   */
  async decodeFromUrl(url, audioCtx, { persist = true, cacheKey } = {}) {
    const context =
      audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const key = cacheKey || cacheKeyFromUrl(url);
    if (!key) throw new Error('No audio URL');

    if (decodedCache.has(key)) {
      return decodedCache.get(key);
    }

    let arrayBuffer = null;
    const canPersist = persist && key.startsWith('/assets/');

    if (canPersist) {
      arrayBuffer = await audioStore.getItem(key);
    }

    if (!arrayBuffer) {
      arrayBuffer = await fetchArrayBuffer(url);
      if (canPersist) {
        try {
          await audioStore.setItem(key, arrayBuffer);
        } catch (err) {
          console.warn('Audio cache write failed:', err);
        }
      }
    }

    const audioBuffer = await context.decodeAudioData(arrayBuffer.slice(0));
    decodedCache.set(key, audioBuffer);
    return audioBuffer;
  },

  /** Legacy helper: decode `/assets/sounds/${title}.mp3`. */
  async decodeSound({ title }, audioCtx) {
    return this.decodeFromUrl(`/assets/sounds/${title}.mp3`, audioCtx, {
      cacheKey: `/assets/sounds/${title}.mp3`,
    });
  },

  async getDecodedBuffer(title, audioCtx) {
    const key = `/assets/sounds/${title}.mp3`;
    if (decodedCache.has(key)) return decodedCache.get(key);

    const context =
      audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const arrayBuffer = await audioStore.getItem(key);
    if (!arrayBuffer) return null;

    const audioBuffer = await context.decodeAudioData(arrayBuffer.slice(0));
    decodedCache.set(key, audioBuffer);
    return audioBuffer;
  },

  /** Warm IndexedDB for known local library titles (best-effort, non-blocking). */
  async warmLibrary(titles = []) {
    const jobs = titles.map(async title => {
      const key = `/assets/sounds/${title}.mp3`;
      if (await audioStore.getItem(key)) return;
      try {
        const buf = await fetchArrayBuffer(key);
        await audioStore.setItem(key, buf);
      } catch {
        // ignore missing / network errors
      }
    });
    await Promise.allSettled(jobs);
  },
};
