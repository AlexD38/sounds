import PaulStretch from 'paulstretch';

/** Milder defaults — ×8 on 20s OOM’d / froze browsers. */
export const STRETCH_DEFAULTS = {
  stretchFactor: 4,
  windowSize: 0.25,
  maxInputSeconds: 8,
  useWorkers: true,
};

function sliceBuffer(audioCtx, buffer, maxSeconds = 8) {
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

/** Halve memory / FFT work; stereo image is less critical for stretch texture. */
function toMono(audioCtx, buffer) {
  if (buffer.numberOfChannels === 1) return buffer;
  const out = audioCtx.createBuffer(1, buffer.length, buffer.sampleRate);
  const dest = out.getChannelData(0);
  const channels = [];
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }
  const n = buffer.numberOfChannels;
  for (let i = 0; i < buffer.length; i++) {
    let sum = 0;
    for (let c = 0; c < n; c++) sum += channels[c][i];
    dest[i] = sum / n;
  }
  return out;
}

function adoptBuffer(targetCtx, buffer) {
  if (!buffer) return buffer;
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

/**
 * Paulstretch an AudioBuffer. Returns a buffer belonging to `audioCtx`.
 * `onProgress` receives an integer percent 0–100.
 */
export async function stretchAudioBuffer(
  audioCtx,
  audioBuffer,
  {
    stretchFactor = STRETCH_DEFAULTS.stretchFactor,
    windowSize = STRETCH_DEFAULTS.windowSize,
    maxInputSeconds = STRETCH_DEFAULTS.maxInputSeconds,
    useWorkers = STRETCH_DEFAULTS.useWorkers,
    onProgress,
  } = {}
) {
  const sliced = sliceBuffer(audioCtx, audioBuffer, maxInputSeconds);
  const input = toMono(audioCtx, sliced);
  const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
  const ps = new PaulStretch({
    stretchFactor,
    windowSize,
    useWorkers,
    numWorkers: Math.min(2, navigator.hardwareConcurrency || 2),
    audioContext: AudioCtxClass,
  });

  let lastPct = -1;
  const report = ratio => {
    if (!onProgress) return;
    const pct = Math.round(Math.min(1, Math.max(0, Number(ratio) || 0)) * 100);
    if (pct === lastPct) return;
    lastPct = pct;
    onProgress(pct);
  };

  try {
    report(0);
    const stretched = await ps.stretch(input, report);
    report(100);
    return adoptBuffer(audioCtx, stretched);
  } finally {
    ps.dispose?.();
    try {
      await ps.audioContext?.close?.();
    } catch {
      // ignore close errors on shared/closed contexts
    }
  }
}
