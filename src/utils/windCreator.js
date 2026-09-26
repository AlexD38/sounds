import { perlinNoise } from './utils';

// ---------------------------------------------------------------------------
// Identité du player
// ---------------------------------------------------------------------------

export const WIND_CREATOR_TITLE = 'windCreator';

export const isWindCreator = title => title === WIND_CREATOR_TITLE;

export const WIND_DEFAULT_FILTER = 900;
export const WIND_FILTER_MAX = 5000;
export const WIND_MIN_GAIN = 0.0;

/** Nombre max de pistes que l'utilisateur peut empiler. */
export const MAX_WIND_LAYERS = 3;

// ---------------------------------------------------------------------------
// Une piste = bruit → HP → LP → gain (Perlin à sa speed)
// ---------------------------------------------------------------------------

/** Réglages par défaut d'une nouvelle piste (profil flutter). */
export const DEFAULT_LAYER_SETTINGS = {
  enabled: true,
  volume: 0.7,
  speed: 0.0245,
  highpass: 700,
  lowpass: 8000,
};

/** Curseurs propres à chaque piste (HP/LP → BandFilterSlider). */
export const WIND_LAYER_SLIDERS = [
  {
    key: 'speed',
    label: 'Speed',
    icon: 'gauge-high',
    min: 0.0005,
    max: 0.08,
    step: 0.0005,
  },
  {
    key: 'volume',
    label: 'Volume',
    icon: 'volume-high',
    min: 0,
    max: 1,
    step: 0.01,
  },
];

/** Plage Hz du slider bande par piste (alignée sur l’ancien LP wind). */
export const WIND_BAND_FILTER = {
  min: 20,
  max: 12000,
  step: 10,
  gap: 50,
};

let layerIdCounter = 1;

export function createWindLayer(overrides = {}) {
  const id = `layer-${layerIdCounter++}`;
  return {
    id,
    ...DEFAULT_LAYER_SETTINGS,
    ...overrides,
  };
}

/**
 * Paramètres live (state React + lecture à chaque tick audio).
 * Par défaut : une seule piste (flutter).
 */
export const DEFAULT_WIND_PARAMS = {
  layers: [
    createWindLayer({
      volume: 0.7,
      speed: 0.0245,
      highpass: 700,
      lowpass: 8000,
    }),
  ],
};

/** Plus de curseurs globaux — tout est fixé en dur. */
export const WIND_GLOBAL_SLIDERS = [];

/** Lissage volume (secondes) — assez court pour pouvoir redescendre à 0. */
const VOLUME_SMOOTH = 0.08;

/** Courbe d'intensité Perlin — fixé, plus de curseur UI. */
const INTENSITY_CURVE = 4;

/** Plancher de volume — fixé à 0. */
const MIN_GAIN = 0;

/** Intervalle de la boucle de modulation (ms). */
const UPDATE_EVERY_MS = 80;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function perlin01(x) {
  return (perlinNoise(x) + 1) / 2;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeLayer(layer) {
  const base = { ...DEFAULT_LAYER_SETTINGS, ...layer };
  if (base.volume == null && base.weight != null) {
    base.volume = base.weight;
  }
  delete base.weight;
  if (!base.id) {
    base.id = `layer-${layerIdCounter++}`;
  }
  return base;
}

/** Fusionne les params UI avec les défauts. */
export function mergeWindParams(partial) {
  const base = DEFAULT_WIND_PARAMS;
  const incoming = partial || {};

  let layers;
  if (Array.isArray(incoming.layers) && incoming.layers.length > 0) {
    layers = incoming.layers.slice(0, MAX_WIND_LAYERS).map(normalizeLayer);
  } else {
    layers = base.layers.map(layer => normalizeLayer({ ...layer }));
  }

  return {
    ...base,
    ...incoming,
    layers,
  };
}

/** Serializable snapshot of wind params (strips non-JSON-safe fields). */
export function serializeWindParams(params) {
  const merged = mergeWindParams(params);
  return {
    layers: merged.layers.map(layer => ({
      id: layer.id,
      enabled: Boolean(layer.enabled),
      volume: Number(layer.volume),
      speed: Number(layer.speed),
      highpass: Number(layer.highpass),
      lowpass: Number(layer.lowpass),
    })),
  };
}

/** Ajoute une piste (max MAX_WIND_LAYERS). */
export function addWindLayer(params) {
  const current = mergeWindParams(params);
  if (current.layers.length >= MAX_WIND_LAYERS) return current;

  return {
    ...current,
    layers: [
      ...current.layers,
      createWindLayer({
        // Légère variation pour que la nouvelle piste se distingue
        highpass: 400 + current.layers.length * 200,
        lowpass: 6000 + current.layers.length * 1000,
        speed: 0.04 + current.layers.length * 0.01,
        volume: 0.55,
      }),
    ],
  };
}

/** Supprime une piste par id (il en reste au moins une). */
export function removeWindLayer(params, layerId) {
  const current = mergeWindParams(params);
  if (current.layers.length <= 1) return current;

  return {
    ...current,
    layers: current.layers.filter(layer => layer.id !== layerId),
  };
}

// ---------------------------------------------------------------------------
// 1) Bruit rose
// ---------------------------------------------------------------------------

export function fillPinkNoise(samples) {
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  let b3 = 0;
  let b4 = 0;
  let b5 = 0;
  let b6 = 0;

  for (let i = 0; i < samples.length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    samples[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
}

export function createWindNoiseBuffer(audioCtx, durationSec = 3) {
  const sampleRate = audioCtx.sampleRate;
  const sampleCount = Math.floor(sampleRate * durationSec);
  const buffer = audioCtx.createBuffer(1, sampleCount, sampleRate);
  fillPinkNoise(buffer.getChannelData(0));
  return buffer;
}

// ---------------------------------------------------------------------------
// 2) Graphe : toujours MAX_WIND_LAYERS slots (slots inutilisés = gain 0)
// ---------------------------------------------------------------------------

/**
 * @returns {{
 *   sourceNode: AudioBufferSourceNode,
 *   masterGain: GainNode,
 *   layerNodes: Array<{ highpass: BiquadFilterNode, lowpass: BiquadFilterNode, gain: GainNode }>
 * }}
 */
export function buildWindLayerGraph(audioCtx, noiseBuffer, initialLayers) {
  const layersConfig = Array.isArray(initialLayers)
    ? initialLayers
    : DEFAULT_WIND_PARAMS.layers;

  const sourceNode = audioCtx.createBufferSource();
  sourceNode.buffer = noiseBuffer;
  sourceNode.loop = true;

  const masterGain = audioCtx.createGain();
  masterGain.gain.value = 0;

  const layerNodes = [];

  for (let i = 0; i < MAX_WIND_LAYERS; i++) {
    const cfg = layersConfig[i] || DEFAULT_LAYER_SETTINGS;

    const highpass = audioCtx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(cfg.highpass, audioCtx.currentTime);
    highpass.Q.setValueAtTime(0.7, audioCtx.currentTime);

    const lowpass = audioCtx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(cfg.lowpass, audioCtx.currentTime);
    lowpass.Q.setValueAtTime(0.7, audioCtx.currentTime);

    const gain = audioCtx.createGain();
    gain.gain.value = 0;

    sourceNode.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(masterGain);

    layerNodes.push({ highpass, lowpass, gain });
  }

  return { sourceNode, masterGain, layerNodes };
}

export function disconnectWindLayerGraph(layerNodes) {
  if (!layerNodes) return;
  for (const nodes of layerNodes) {
    if (!nodes) continue;
    try {
      nodes.highpass.disconnect();
    } catch {
      /* already disconnected */
    }
    try {
      nodes.lowpass.disconnect();
    } catch {
      /* already disconnected */
    }
    try {
      nodes.gain.disconnect();
    } catch {
      /* already disconnected */
    }
  }
}

// ---------------------------------------------------------------------------
// 3) Modulation
// ---------------------------------------------------------------------------

export function startWindModulation({
  masterGain,
  layerNodes,
  audioCtx,
  maxGain = 1.5,
  getParams,
  intervalRef,
}) {
  if (!masterGain || !layerNodes || !audioCtx || !intervalRef) return;

  if (intervalRef.current) {
    clearInterval(intervalRef.current);
  }

  const layerTime = Array.from(
    { length: MAX_WIND_LAYERS },
    () => Math.random() * 100
  );

  const startTime = audioCtx.currentTime;
  masterGain.gain.cancelScheduledValues(startTime);
  masterGain.gain.setValueAtTime(0, startTime);
  masterGain.gain.linearRampToValueAtTime(maxGain, startTime + 0.4);

  const readParams = () => mergeWindParams(getParams?.());

  const tick = () => {
    if (!masterGain || !audioCtx) return;

    const params = readParams();
    const now = audioCtx.currentTime;
    const curve = INTENSITY_CURVE;
    const smooth = VOLUME_SMOOTH;
    const floor = MIN_GAIN;
    const layers = params.layers;

    for (let i = 0; i < MAX_WIND_LAYERS; i++) {
      const nodes = layerNodes[i];
      const layer = layers[i];
      if (!nodes) continue;

      // Slot sans piste → silence
      if (!layer) {
        nodes.gain.gain.setTargetAtTime(0, now, smooth);
        continue;
      }

      const hpHz = clamp(layer.highpass, 20, 8000);
      const lpHz = clamp(Math.max(layer.lowpass, hpHz + 50), 80, 16000);
      nodes.highpass.frequency.setTargetAtTime(hpHz, now, 0.05);
      nodes.lowpass.frequency.setTargetAtTime(lpHz, now, 0.05);

      if (!layer.enabled) {
        nodes.gain.gain.setTargetAtTime(0, now, smooth);
        continue;
      }

      const raw = perlin01(layerTime[i]);
      const intensity = Math.pow(raw, curve);
      const layerGain = layer.volume * (floor + intensity * (1 - floor));

      nodes.gain.gain.setTargetAtTime(Math.max(0, layerGain), now, smooth);
      layerTime[i] += Math.max(0.0001, layer.speed);
    }
  };

  tick();

  const schedule = () => {
    intervalRef.current = setInterval(tick, UPDATE_EVERY_MS);
  };

  schedule();

  // Gardé pour compat Player (plus de changement live de l'intervalle)
  intervalRef.restart = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    schedule();
  };

  intervalRef.setMasterGain = value => {
    if (!masterGain || !audioCtx) return;
    const now = audioCtx.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setTargetAtTime(Math.max(0, value), now, 0.05);
  };
}

export function stopWindModulation(intervalRef) {
  if (intervalRef?.current) {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  }
}
