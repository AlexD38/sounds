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
  const response = await fetch(
    `https://freesound.org/apiv2/search/text/?token=${token}&query=${query}&filter=category:Music`
  );

  let datas = await response.json();
  datas = datas.results;
  console.log('retrieved responses for that query');

  let randomIndex = +(Math.random(datas.length) * 10).toFixed(0);

  let randomResultId = datas[randomIndex].id;

  const responseId = await fetch(
    `https://freesound.org/apiv2/sounds/${randomResultId}/?token=${token}`
  );
  console.log('retrieved 1st responseId');

  let previews = await fetch(responseId.url);
  previews = await previews.json();
  const rating = previews.avg_rating;

  if (rating < 4) {
    randomIndex = +(Math.random(datas.length) * 10).toFixed(0);
    const responseId = await fetch(
      `https://freesound.org/apiv2/sounds/${randomResultId}/?token=${token}`
    );
    let previews = await fetch(responseId.url);
    previews = await previews.json();
  }

  const mp3Preview = `${previews.previews['preview-hq-mp3']}?token=${token}`;
  console.log('extracted preveiws');

  const obj = {
    url: mp3Preview,
    title: query,
    image: previews.images['spectral_bw_l'],
    tags: previews.category,
    similar: previews.similar_sounds,
  };
  return { obj };
};
