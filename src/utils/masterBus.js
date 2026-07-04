import {
  MASTER_COMPRESSOR_ATTACK,
  MASTER_COMPRESSOR_KNEE,
  MASTER_COMPRESSOR_RATIO,
  MASTER_COMPRESSOR_RELEASE,
  MASTER_COMPRESSOR_THRESHOLD,
} from '../ref/mix.constants';

let audioCtx = null;
let inputBus = null;
let compressor = null;

function ensureMasterBus() {
  if (audioCtx) return audioCtx;

  audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  inputBus = audioCtx.createGain();
  inputBus.gain.value = 1;

  compressor = audioCtx.createDynamicsCompressor();
  const now = audioCtx.currentTime;
  compressor.threshold.setValueAtTime(MASTER_COMPRESSOR_THRESHOLD, now);
  compressor.knee.setValueAtTime(MASTER_COMPRESSOR_KNEE, now);
  compressor.ratio.setValueAtTime(MASTER_COMPRESSOR_RATIO, now);
  compressor.attack.setValueAtTime(MASTER_COMPRESSOR_ATTACK, now);
  compressor.release.setValueAtTime(MASTER_COMPRESSOR_RELEASE, now);

  inputBus.connect(compressor);
  compressor.connect(audioCtx.destination);

  return audioCtx;
}

export function getSharedAudioContext() {
  return ensureMasterBus();
}

export function connectToMasterBus(audioNode) {
  ensureMasterBus();
  audioNode.connect(inputBus);
}

export async function resumeSharedAudioContext() {
  const ctx = ensureMasterBus();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
  return ctx;
}
