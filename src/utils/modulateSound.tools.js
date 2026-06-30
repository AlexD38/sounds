import { perlinNoise } from './utils';

export const soundTools = {
  filter: {},
  volume: {},
  stereo: {},
  speed: {},
  perlinNoise: {
    startPerlinModulation(
      minGain = 0,
      maxGain = 1.5,
      gainNodeRef,
      audioCtxRef,
      modulatorIntervalRef
    ) {
      if (!gainNodeRef.current || !audioCtxRef.current) return;

      // Clear d'abord pour éviter les doublons
      if (modulatorIntervalRef.current) {
        clearInterval(modulatorIntervalRef.current);
      }

      let t = 0;
      const speed = 0.005;

      modulatorIntervalRef.current = setInterval(() => {
        const noise = perlinNoise(t);
        const mapped = (noise + 1) / 2;
        const newGain = minGain + mapped * (maxGain - minGain);

        gainNodeRef.current.gain.setTargetAtTime(
          newGain,
          audioCtxRef.current.currentTime,
          0.05
        );

        t += speed;
      }, 50);
    },
    stopPerlinModulation(modulatorIntervalRef) {
      if (modulatorIntervalRef.current) {
        clearInterval(modulatorIntervalRef.current);
        modulatorIntervalRef.current = null;
      }
    },
  },
  Stretcher: {},
  noise: {
    createWhiteNoise(audioCtx, noiseSourceRef) {
      const bufferSize = 2 * audioCtx.sampleRate;
      const noiseBuffer = audioCtx.createBuffer(
        1,
        bufferSize,
        audioCtx.sampleRate
      );
      const output = noiseBuffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }

      const noiseSource = audioCtx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;
      noiseSourceRef.current = noiseSource;

      const gainNode = audioCtx.createGain();
      return { gainNode, noiseSource };
    },
  },
};
