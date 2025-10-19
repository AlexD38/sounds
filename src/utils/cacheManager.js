import localforage from 'localforage';

const decodedCache = new Map(); // RAM cache: { title -> AudioBuffer }

export const cacheManager = {
  // -------------------------------
  // 1. Préchargement & mise en cache
  // -------------------------------
  async decodeSounds(config, audioCtx) {
    const context =
      audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const decodedSounds = [];

    for (const { title } of config) {
      if (title === 'whiteNoise' || title === 'music') continue;

      const url = `/assets/sounds/${title}.mp3`;

      try {
        // Récupère depuis le cache
        let arrayBuffer = await localforage.getItem(title);

        if (!arrayBuffer) {
          // Sinon fetch depuis le réseau
          const response = await fetch(url);
          arrayBuffer = await response.arrayBuffer();

          // Stocke en cache (ArrayBuffer brut)
          await localforage.setItem(title, arrayBuffer);
          console.log(`${title} stored in IndexedDB`);
        } else {
          console.log(`${title} loaded from IndexedDB`);
        }

        // Décodage UNE SEULE FOIS
        let audioBuffer;
        if (decodedCache.has(title)) {
          audioBuffer = decodedCache.get(title);
        } else {
          audioBuffer = await context.decodeAudioData(arrayBuffer.slice(0));
          decodedCache.set(title, audioBuffer);
          console.log(`${title} decoded and stored in RAM cache`);
        }

        decodedSounds.push({ title, audioBuffer });
      } catch (error) {
        console.error(`Erreur avec ${title}:`, error);
      }
    }

    return decodedSounds;
  },

  // -------------------------------
  // 2. Récupération d'un son décodé
  // -------------------------------
  async getDecodedBuffer(title, audioCtx) {
    const context =
      audioCtx || new (window.AudioContext || window.webkitAudioContext)();

    // Déjà en RAM
    if (decodedCache.has(title)) {
      return decodedCache.get(title);
    }

    // Sinon depuis IndexedDB
    const arrayBuffer = await localforage.getItem(title);
    if (!arrayBuffer) return null;

    const audioBuffer = await context.decodeAudioData(arrayBuffer.slice(0));
    decodedCache.set(title, audioBuffer);
    return audioBuffer;
  },
};
