import { connectToMasterBus } from './masterBus';

/**
 * Spatial chain: optional Haas width blend + stereo pan.
 * Connect `inputNode` into this chain; output goes to the master bus.
 *
 * Graph: input → dryGain (1-width) ─┬→ merger → panner → bus
 *         input → wetGain (width) → Haas ─┘
 */
export function buildSpatialChain(audioCtx, inputNode, { pan = 0, width = 0 } = {}) {
  const clampedWidth = Math.max(0, Math.min(1, Number(width) || 0));
  const clampedPan = Math.max(-1, Math.min(1, Number(pan) || 0));

  const dryGain = audioCtx.createGain();
  const wetGain = audioCtx.createGain();
  dryGain.gain.value = 1 - clampedWidth;
  wetGain.gain.value = clampedWidth;

  const delayRight = audioCtx.createDelay(0.05);
  delayRight.delayTime.setValueAtTime(0.025, audioCtx.currentTime);

  const merger = audioCtx.createChannelMerger(2);
  const panner = audioCtx.createStereoPanner();
  panner.pan.setValueAtTime(clampedPan, audioCtx.currentTime);

  inputNode.connect(dryGain);
  dryGain.connect(merger, 0, 0);
  dryGain.connect(merger, 0, 1);

  inputNode.connect(wetGain);
  wetGain.connect(merger, 0, 0);
  wetGain.connect(delayRight);
  delayRight.connect(merger, 0, 1);

  merger.connect(panner);
  connectToMasterBus(panner);

  return {
    dryGain,
    wetGain,
    delayRight,
    merger,
    panner,
    setPan(value) {
      const next = Math.max(-1, Math.min(1, Number(value) || 0));
      panner.pan.setTargetAtTime(next, audioCtx.currentTime, 0.03);
    },
    setWidth(value) {
      const w = Math.max(0, Math.min(1, Number(value) || 0));
      const now = audioCtx.currentTime;
      dryGain.gain.setTargetAtTime(1 - w, now, 0.03);
      wetGain.gain.setTargetAtTime(w, now, 0.03);
    },
    disconnect() {
      try {
        dryGain.disconnect();
        wetGain.disconnect();
        delayRight.disconnect();
        merger.disconnect();
        panner.disconnect();
      } catch {
        // already disconnected
      }
    },
  };
}

/** Pan-only chain for layered creators (wind). */
export function buildPanOnlyChain(audioCtx, inputNode, pan = 0) {
  const panner = audioCtx.createStereoPanner();
  const clampedPan = Math.max(-1, Math.min(1, Number(pan) || 0));
  panner.pan.setValueAtTime(clampedPan, audioCtx.currentTime);
  inputNode.connect(panner);
  connectToMasterBus(panner);
  return {
    panner,
    setPan(value) {
      const next = Math.max(-1, Math.min(1, Number(value) || 0));
      panner.pan.setTargetAtTime(next, audioCtx.currentTime, 0.03);
    },
    setWidth() {},
    disconnect() {
      try {
        panner.disconnect();
      } catch {
        // already disconnected
      }
    },
  };
}
