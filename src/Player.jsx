import { useContext, useRef, useState } from 'react';
import './App.css';
import { Context } from './context/context';
import { SearchThatSound } from './utils/utils';

function Player({ title, sourcePath, custom }) {
  const [filterValue, setFilterValue] = useState(800);
  const [volValue, setVolValue] = useState(0.5);
  const [isPLaying, setIsPlaying] = useState();
  const audioCtxRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const noiseSourceRef = useRef(null);
  const gainNodeRef = useRef(null);
  const filterRef = useRef(null);
  const modulatorIntervalRef = useRef(null);
  const stereoAppliedRef = useRef(false);
  const token = import.meta.env.VITE_API_KEY;

  const { customSound, setCustomSound, currentInput, setCurrentInput } =
    useContext(Context);

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

    setVolValue(value);

    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setTargetAtTime(
        value,
        audioCtxRef.current.currentTime,
        0.01
      );
    }
  };
  async function play(event, sourcePath, custom) {
    setIsPlaying(true);
    if (isPLaying && event.target.dataset.stop) {
      setIsPlaying(false);
      stop();
      return;
    }
    if (isPLaying) {
      return;
    }
    if (sourcePath) {
      await playFromSource(sourcePath, custom);
      return;
    }

    if (audioCtxRef.current) return;

    const audioCtx = new window.AudioContext();
    audioCtxRef.current = audioCtx;

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
  async function playFromSource(sourcePath, custom) {
    try {
      // Crée un nouveau contexte audio si nécessaire
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
      }
      const audioCtx = audioCtxRef.current;

      const response = await fetch(sourcePath);
      console.log('final fetch for reading');
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
    setIsPlaying(false);
    console.log('stop');
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

  const refresh = async () => {
    const { obj } = await SearchThatSound(currentInput);
    setCustomSound(obj);
    stop();
    playFromSource(obj.url);
    setIsPlaying(true);
  };

  return (
    <div
      data-stop={true}
      className={
        isPLaying
          ? ' player-container is-playing playing expand'
          : 'player-container'
      }
      onClick={event => play(event, sourcePath)}
    >
      <h3 className={isPLaying ? 'playing' : ''}>{title}</h3>
      {isPLaying && (
        <div className="main-container">
          {isPLaying && (
            <div className="sliders-container">
              <span>Filter</span>
              <input
                className="noise-range"
                type="range"
                min="50"
                max="1500"
                step="10"
                onChange={handleFilterValue}
              />
              <span>Volume</span>
              <input
                className="vol-range"
                type="range"
                min="0"
                max="100"
                step="1"
                defaultValue={50}
                onChange={handleVolValue}
              />
            </div>
          )}

          <div className="btn-container">
            {isPLaying && (
              <>
                <button onClick={stop} data-stop={true}>
                  <i className="fa-solid fa-pause playing" data-stop={true}></i>
                </button>
                <button onClick={applyStereoEffectNow}>
                  <i className="fa-solid fa-check-double playing"></i>
                </button>
                {custom && (
                  <button onClick={refresh}>
                    <i className="fa-solid fa-arrows-rotate playing"></i>{' '}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Player;
