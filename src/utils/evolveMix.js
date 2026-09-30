import { config } from '../ref/random.config';
import { hasFreesoundApiKey } from '../ref/localMusic';
import { randomWindParams } from '../ref/windPresets';
import { isWindCreator } from './windCreator';

function pickVolume() {
  return 0.55 + Math.random() * 0.9;
}

function pickFilter() {
  return 700 + Math.floor(Math.random() * 1400);
}

function pickSpeed(supportsSpeed) {
  if (!supportsSpeed) return undefined;
  return 0.75 + Math.random() * 0.5;
}

function buildPlayerEntry(targetedPlayer) {
  const entry = {
    playerTitle: targetedPlayer.title,
    isPlaying: true,
    volume: pickVolume(),
    filter: isWindCreator(targetedPlayer.title) ? 900 : pickFilter(),
  };

  const speed = pickSpeed(targetedPlayer.speed);
  if (speed != null) entry.speed = speed;

  if (isWindCreator(targetedPlayer.title)) {
    entry.windParams = randomWindParams();
  }

  return entry;
}

function snapshotPlayingEntries(snapshotMix) {
  const playing = [];
  for (const [title, data] of snapshotMix.entries()) {
    if (!data?.isPlaying) continue;
    playing.push({
      playerTitle: title,
      isPlaying: true,
      volume: data.volume,
      filter: data.filter,
      highpass: data.highpass,
      speed: data.speed,
      windParams: data.windParams,
      pan: data.pan,
      width: data.width,
      stretch: data.stretch,
    });
  }
  return playing;
}

function getPool() {
  return config.filter(player => {
    if (player.title === 'music') return hasFreesoundApiKey();
    return true;
  });
}

function nudgeEntry(entry) {
  const next = { ...entry, volume: pickVolume() };
  if (isWindCreator(entry.playerTitle)) {
    next.windParams = randomWindParams();
  } else {
    next.filter = pickFilter();
  }
  return next;
}

const MAX_LAYERS = 3;

/** Fade length for an evolve mute, play (add) or swap. Pivot layers are untouched. */
export const EVOLVE_FADE_SEC = 10;

/**
 * Evolve the current mix with a stable pivot layer.
 * Always keeps ≥1 unchanged player so ambience carries over.
 * Applies a single step (add, mute or swap one layer) — never all at once.
 * Size stays within 1–MAX_LAYERS. One layer is allowed for a single step;
 * the next tick always adds, so evolve never stays stuck on one player.
 */
export function evolveMix({
  snapshotMix,
  loadMix,
  setNotification,
  silent = false,
}) {
  const playing = snapshotPlayingEntries(snapshotMix);

  if (playing.length === 0) {
    if (!silent) {
      setNotification({ message: 'Play something first to evolve it' });
      setTimeout(() => setNotification(null), 3000);
    }
    return null;
  }

  const pool = getPool();
  const nextPlayers = playing.map(p => ({ ...p }));

  const freePool = pool.filter(
    p => !nextPlayers.some(n => n.playerTitle === p.title)
  );
  const pickFree = () =>
    freePool[Math.floor(Math.random() * freePool.length)];

  if (nextPlayers.length === 1) {
    // One layer is the pivot. Always grow so the next mix is not stuck at 1.
    if (freePool.length > 0) {
      nextPlayers.push(buildPlayerEntry(pickFree()));
    } else {
      nextPlayers[0] = nudgeEntry(nextPlayers[0]);
    }
  } else if (nextPlayers.length > MAX_LAYERS) {
    // Above the cap: drop one non-pivot layer until we are back within range.
    const pivotIdx = Math.floor(Math.random() * nextPlayers.length);
    const candidates = [];
    for (let i = 0; i < nextPlayers.length; i++) {
      if (i !== pivotIdx) candidates.push(i);
    }
    const targetIdx =
      candidates[Math.floor(Math.random() * candidates.length)];
    nextPlayers.splice(targetIdx, 1);
  } else {
    // Pick a pivot that never changes (same player + params).
    const pivotIdx = Math.floor(Math.random() * nextPlayers.length);

    const candidates = [];
    for (let i = 0; i < nextPlayers.length; i++) {
      if (i !== pivotIdx) candidates.push(i);
    }
    const targetIdx =
      candidates[Math.floor(Math.random() * candidates.length)];

    const actions = [];
    // Mute may land on a single layer; the following tick adds one back.
    if (nextPlayers.length > 1) actions.push('mute');
    if (freePool.length > 0) actions.push('swap');
    if (nextPlayers.length < MAX_LAYERS && freePool.length > 0) {
      actions.push('add');
    }
    const action =
      actions.length > 0
        ? actions[Math.floor(Math.random() * actions.length)]
        : 'nudge';

    if (action === 'mute') {
      nextPlayers.splice(targetIdx, 1);
    } else if (action === 'swap') {
      nextPlayers[targetIdx] = buildPlayerEntry(pickFree());
    } else if (action === 'add') {
      nextPlayers.push(buildPlayerEntry(pickFree()));
    } else {
      nextPlayers[targetIdx] = nudgeEntry(nextPlayers[targetIdx]);
    }
  }

  if (nextPlayers.length === 0) {
    nextPlayers.push(
      buildPlayerEntry(pool[Math.floor(Math.random() * pool.length)])
    );
  }

  const label = 'Evolved mix';
  const snapMap = new Map();
  snapMap.set(label, { title: label, players: nextPlayers });

  loadMix({
    label,
    snapMap,
    activeMix: { type: 'random', label },
    fadeDuration: EVOLVE_FADE_SEC,
  });

  if (!silent) {
    setNotification({ message: 'Mix evolved' });
    setTimeout(() => setNotification(null), 3000);
  }

  return label;
}

/** Fixed interval options (seconds). `null` / 'auto' = random 20–60 each tick. */
export const EVOLVE_INTERVAL_PRESETS = [20, 30, 45, 60];

export const EVOLVE_INTERVAL_MIN = 20;
export const EVOLVE_INTERVAL_MAX = 60;

/** @param {number | 'auto' | null} intervalSec */
export function nextEvolveDelayMs(intervalSec) {
  if (typeof intervalSec === 'number' && intervalSec > 0) {
    return intervalSec * 1000;
  }
  const sec =
    EVOLVE_INTERVAL_MIN +
    Math.random() * (EVOLVE_INTERVAL_MAX - EVOLVE_INTERVAL_MIN);
  return Math.round(sec * 1000);
}

export function formatEvolveInterval(intervalSec) {
  if (intervalSec == null || intervalSec === 'auto') {
    return 'every 20–60s';
  }
  return `every ${intervalSec}s`;
}
