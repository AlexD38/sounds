import localforage from 'localforage';

export const cacheManager = {
  async decodeSounds(config, audioCtx) {
    const context = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const decodedSounds = [];

    for (const { title } of config) {
      if (title === 'whiteNoise' || title === 'music') continue;

      const url = `/assets/sounds/${title}.mp3`;

      try {
        const response = await fetch(url);
        const originalBuffer = await response.arrayBuffer();

        // ✅ Clone l’ArrayBuffer AVANT décodage
        const bufferForCache = originalBuffer.slice(0);
        const audioBuffer = await context.decodeAudioData(originalBuffer);

        // ✅ On stocke le clone, pas celui utilisé pour le décodage
        await this.setCache(title, bufferForCache);
        console.log(`${title} successfully set in cache`);

        decodedSounds.push({ title, audioBuffer });
      } catch (error) {
        console.error(`Erreur avec ${title}:`, error);
      }
    }

    return decodedSounds;
  },

  async setCache(title, arrayBuffer) {
    await localforage.setItem(title, arrayBuffer);
  },
};
