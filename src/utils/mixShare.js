/** Encode / decode mixes for URL sharing and JSON import-export. */

const SHARE_PARAM = 'mix';

function toBase64Url(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  bytes.forEach(b => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + pad);
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** Snapshot shape: { title, players: [{ playerTitle, isPlaying, volume, ... }] } */
export function serializeMix(snapshot) {
  const payload = {
    v: 1,
    title: snapshot.title || 'Shared mix',
    players: (snapshot.players || [])
      .filter(p => p.isPlaying)
      .map(p => {
        const entry = {
          playerTitle: p.playerTitle,
          isPlaying: true,
        };
        if (p.volume != null) entry.volume = Number(p.volume);
        if (p.filter != null) entry.filter = Number(p.filter);
        if (p.highpass != null) entry.highpass = Number(p.highpass);
        if (p.speed != null) entry.speed = Number(p.speed);
        if (p.windParams) entry.windParams = p.windParams;
        if (p.pan != null) entry.pan = Number(p.pan);
        if (p.width != null) entry.width = Number(p.width);
        if (p.stretch != null) entry.stretch = Boolean(p.stretch);
        return entry;
      }),
  };
  return toBase64Url(JSON.stringify(payload));
}

export function deserializeMix(encoded) {
  const raw = JSON.parse(fromBase64Url(encoded));
  if (!raw || !Array.isArray(raw.players) || raw.players.length === 0) {
    throw new Error('Invalid mix payload');
  }
  return {
    title: raw.title || 'Shared mix',
    players: raw.players.map(p => ({
      playerTitle: p.playerTitle,
      isPlaying: p.isPlaying !== false,
      ...(p.volume != null ? { volume: Number(p.volume) } : {}),
      ...(p.filter != null ? { filter: Number(p.filter) } : {}),
      ...(p.highpass != null ? { highpass: Number(p.highpass) } : {}),
      ...(p.speed != null ? { speed: Number(p.speed) } : {}),
      ...(p.windParams ? { windParams: p.windParams } : {}),
      ...(p.pan != null ? { pan: Number(p.pan) } : {}),
      ...(p.width != null ? { width: Number(p.width) } : {}),
      ...(p.stretch != null ? { stretch: Boolean(p.stretch) } : {}),
    })),
  };
}

export function buildShareUrl(snapshot, baseUrl = window.location.href) {
  const url = new URL(baseUrl);
  url.searchParams.set(SHARE_PARAM, serializeMix(snapshot));
  return url.toString();
}

export function readSharedMixFromLocation(search = window.location.search) {
  const params = new URLSearchParams(search);
  const encoded = params.get(SHARE_PARAM);
  if (!encoded) return null;
  return deserializeMix(encoded);
}

export function clearShareParamFromUrl() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(SHARE_PARAM)) return;
  url.searchParams.delete(SHARE_PARAM);
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);
}

export function snapshotFromLiveMix(snapshotMix, title = 'Shared mix') {
  const players = [];
  for (const [playerTitle, data] of snapshotMix.entries()) {
    if (!data?.isPlaying) continue;
    players.push({ playerTitle, ...data });
  }
  return { title, players };
}

export function exportMixesJson(savedSnaps) {
  const mixes = Array.from(savedSnaps?.values?.() ?? []).map(snap => ({
    title: snap.title,
    players: snap.players,
  }));
  return JSON.stringify({ v: 1, mixes }, null, 2);
}

export function importMixesJson(text) {
  const data = JSON.parse(text);
  const list = Array.isArray(data) ? data : data.mixes;
  if (!Array.isArray(list)) throw new Error('Expected a mixes array');
  return list.map(snap => ({
    title: snap.title || 'Imported mix',
    players: snap.players || [],
  }));
}

export { SHARE_PARAM };
