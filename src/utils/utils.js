const token = import.meta.env.VITE_API_KEY;

const handleFilterValue = e => {
  const value = parseFloat(e.currentTarget.value);
  setFilterValue(value);
  if (filterRef.current && audioCtxRef.current) {
    filterRef.current.frequency.setTargetAtTime(
      value,
      audioCtxRef.current.currentTime,
      0.01
    );
  }
};
const handleVolValue = e => {
  const value = parseFloat(e.currentTarget.value) / 100;
  console.log('value: ', value);

  setVolValue(value);

  if (gainNodeRef.current && audioCtxRef.current) {
    gainNodeRef.current.gain.setTargetAtTime(
      value,
      audioCtxRef.current.currentTime,
      0.01
    );
  }
};

async function play(sourcePath) {
  if (sourcePath) {
    await playFromSource(sourcePath);
    return;
  }
  if (audioCtxRef.current) return;

  const audioCtx = new window.AudioContext();
  audioCtxRef.current = audioCtx;

  const bufferSize = 2 * audioCtx.sampleRate;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
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
  gainNode.gain.setValueAtTime(volValue, audioCtx.currentTime);
  gainNodeRef.current = gainNode;

  const filter = audioCtx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(filterValue, audioCtx.currentTime);
  filterRef.current = filter;

  // 🔄 Connexion initiale simple (pas de stéréo encore)
  filter.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  noiseSource.connect(filter);
  noiseSource.start();
}

async function playFromSource(sourcePath) {
  console.log('sourcePath: ', sourcePath);

  try {
    // Crée un nouveau contexte audio si nécessaire
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
    }
    const audioCtx = audioCtxRef.current;

    // Télécharge le fichier MP3
    const response = await fetch(sourcePath);
    console.log('response: ', response);

    if (!response.ok) throw new Error('Fichier introuvable ou inaccessible');

    const arrayBuffer = await response.arrayBuffer();

    // Décode les données audio
    const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

    // Stop l'ancienne source si elle existe
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {}
    }

    // Crée un BufferSource pour lire le buffer décodé
    const bufferSource = audioCtx.createBufferSource();
    bufferSource.buffer = audioBuffer;
    bufferSource.loop = true; // facultatif

    // Gain
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(volValue, audioCtx.currentTime);

    // Filtre
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterValue, audioCtx.currentTime);

    // Connexions : source → filtre → gain → destination
    bufferSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Démarre la lecture
    bufferSource.start();

    // Stocke les références
    sourceNodeRef.current = bufferSource;
    gainNodeRef.current = gainNode;
    filterRef.current = filter;
  } catch (err) {
    console.error('Erreur lors de la lecture du fichier :', err);
  }
}

function stop() {
  if (noiseSourceRef.current) {
    noiseSourceRef.current.stop();
    noiseSourceRef.current.disconnect();
    noiseSourceRef.current = null;
  }
  if (filterRef.current) {
    filterRef.current.disconnect();
    filterRef.current = null;
  }
  if (gainNodeRef.current) {
    gainNodeRef.current.disconnect();
    gainNodeRef.current = null;
  }
  if (modulatorIntervalRef.current) {
    clearInterval(modulatorIntervalRef.current);
    modulatorIntervalRef.current = null;
  }
  if (audioCtxRef.current) {
    audioCtxRef.current.close();
    audioCtxRef.current = null;
  }
}

function applyStereoEffectNow() {
  const audioCtx = audioCtxRef.current;
  const filter = filterRef.current;
  const gainNode = gainNodeRef.current;

  if (!audioCtx || !filter || !gainNode || stereoAppliedRef.current) return;

  // Déconnecter l'ancien chemin direct
  filter.disconnect();

  // Appliquer le traitement stéréo
  const stereoSignal = applyStereoDelayRight(audioCtx, filter);

  // Reconnecter vers le gainNode
  stereoSignal.connect(gainNode);

  // Marquer comme appliqué
  stereoAppliedRef.current = true;
}
function applyStereoDelayRight(audioCtx, sourceNode) {
  const splitter = audioCtx.createChannelSplitter(2);
  const delayRight = audioCtx.createDelay();
  delayRight.delayTime.setValueAtTime(0.025, audioCtx.currentTime); // 25ms delay

  const merger = audioCtx.createChannelMerger(2);

  // Connexions :
  sourceNode.connect(splitter);

  // Gauche (direct)
  splitter.connect(merger, 0, 0); // out channel 0 → in channel 0

  // Droite (delay)
  splitter.connect(delayRight, 0); // out channel 0 → delay
  delayRight.connect(merger, 0, 1); // delay output → in channel 1

  return merger; // Tu dois connecter ce "merger" ensuite à la suite (ex: gainNode)
}
export const SearchThatSound = async query => {
  const exclude = [46415, 339671, 335908, 39046, 231562, 2425];
  const response = await fetch(
    `https://freesound.org/apiv2/search/text/?token=${token}&query=${query}&filter=category:Music&filter=description:piano&sort=downloads_desc`
  );

  let datas = await response.json();
  datas = datas.results.filter(x => !exclude.includes(x.id));

  let randomIndex = Math.floor(Math.random() * datas.length);

  let randomResultId = datas[randomIndex].id;

  const responseId = await fetch(
    `https://freesound.org/apiv2/sounds/${randomResultId}/?token=${token}`
  );

  let previews = await fetch(responseId.url);
  previews = await previews.json();
  const duration = previews.duration;

  if (duration < 10) {
    randomIndex = +(Math.random(datas.length) * 10).toFixed(0);
    const responseId = await fetch(
      `https://freesound.org/apiv2/sounds/${randomResultId}/?token=${token}`
    );
    let previews = await fetch(responseId.url);
    previews = await previews.json();
  }

  const mp3Preview = `${previews.previews['preview-hq-mp3']}?token=${token}`;

  const obj = {
    url: mp3Preview,
    title: query,
    image: previews.images['spectral_bw_l'],
    tags: previews.category,
    similar: previews.similar_sounds,
  };
  return { obj };
};
// Petit générateur Perlin 1D
export function perlinNoise(x) {
  const xi = Math.floor(x) & 255;
  const xf = x - Math.floor(x);
  const u = fade(xf);

  const a = grad(p[xi], xf);
  const b = grad(p[xi + 1], xf - 1);

  return lerp(a, b, u);
}

function fade(t) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}
function lerp(a, b, t) {
  return a + t * (b - a);
}
function grad(hash, x) {
  return (hash & 1) === 0 ? x : -x;
}

// permutation table (repeat to avoid overflow)
const p = new Array(512).fill(0).map((_, i) => {
  const perm = [
    151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140,
    36, 103, 30, 69, 142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120,
    234, 75, 0, 26, 197, 62, 94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33,
    88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 71,
    134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133,
    230, 220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161,
    1, 216, 80, 73, 209, 76, 132, 187, 208, 89, 18, 169, 200, 196, 135, 130,
    116, 188, 159, 86, 164, 100, 109, 198, 173, 186, 3, 64, 52, 217, 226, 250,
    124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227,
    47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44,
    154, 163, 70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98,
    108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228, 251, 34,
    242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 145, 235, 249, 14,
    239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115, 121,
    50, 45, 127, 4, 150, 254,
  ];
  return perm[i % 256];
});

export function handleSnapshotMix(previousSituation, eltToAdd) {
  console.log('previousSituation: ', previousSituation);
  console.log('eltToAdd: ', eltToAdd);
  let newSituation;

  return newSituation;
}
