import PaulStretch from 'paulstretch';

function sliceBuffer(audioCtx, buffer, maxSeconds = 20) {
  const maxFrames = Math.floor(maxSeconds * buffer.sampleRate);
  if (buffer.length <= maxFrames) return buffer;

  const sliced = audioCtx.createBuffer(
    buffer.numberOfChannels,
    maxFrames,
    buffer.sampleRate
  );
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    sliced.copyToChannel(buffer.getChannelData(c).subarray(0, maxFrames), c);
  }
  return sliced;
}

function adoptBuffer(targetCtx, buffer) {
  if (!buffer || targetCtx.sampleRate === buffer.sampleRate) {
    // Still copy into target context for compatibility across AudioContexts
    const out = targetCtx.createBuffer(
      buffer.numberOfChannels,
      buffer.length,
      buffer.sampleRate
    );
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      out.copyToChannel(buffer.getChannelData(c), c);
    }
    return out;
  }
  return buffer;
}

/**
 * Paulstretch an AudioBuffer. Uses a short slice by default (CPU-friendly).
 * Returns a buffer belonging to `audioCtx`.
 */
export async function stretchAudioBuffer(
  audioCtx,
  audioBuffer,
  { stretchFactor = 8, windowSize = 0.25, maxInputSeconds = 20, onProgress } = {}
) {
  const input = sliceBuffer(audioCtx, audioBuffer, maxInputSeconds);
  const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
  const ps = new PaulStretch({
    stretchFactor,
    windowSize,
    useWorkers: false,
    audioContext: AudioCtxClass,
  });

  try {
    const stretched = await ps.stretch(input, onProgress || (() => {}));
    return adoptBuffer(audioCtx, stretched);
  } finally {
    ps.dispose?.();
  }
}
