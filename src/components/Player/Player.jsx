import { useContext, useRef, useState, useEffect } from 'react';
import '../../App.css';
import { Context } from '../../context/context';
import {
  handleSnapshotMix,
  perlinNoise,
  SearchThatSound,
} from '../../utils/utils';
import { soundTools } from '../../utils/modulateSound.tools';
import { PlayerTitle } from '../PlayerTitle/PlayerTitle';

function getRMS(audioBuffer) {
  const channelData = audioBuffer.getChannelData(0); // Use the first channel
  let sumOfSquares = 0;
  for (let i = 0; i < channelData.length; i++) {
    sumOfSquares += channelData[i] * channelData[i];
  }
  const meanSquare = sumOfSquares / channelData.length;
  return Math.sqrt(meanSquare);
}

function Player({ title, sourcePath, custom, speed, stopAll }) {
  const {
    snapshotMix,
    registerPlayerSituation,
    savedSnaps,
    loadASnap,
    setLoadASnap,
    playingSnap,
    setStopAll,
  } = useContext(Context);

  const [filterValue, setFilterValue] = useState(1800);
  const [volValue, setVolValue] = useState(1.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isStereo, setIsStereo] = useState(false);
  const [normalizationFactor, setNormalizationFactor] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const audioCtxRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const noiseSourceRef = useRef(null);
  const gainNodeRef = useRef(null);
  const filterRef = useRef(null);
  const modulatorIntervalRef = useRef(null);

  const stereoNodesRef = useRef(null);
  const token = import.meta.env.VITE_API_KEY;

  const { customSound, setCustomSound, currentInput, setCurrentInput } =
    useContext(Context);

  useEffect(() => {
    if (stopAll) {
      stop();
      setIsPlaying(false);
      return;
    }
    if (!savedSnaps || !loadASnap) {
      return;
    }

    const loadedSnap = savedSnaps.get(playingSnap);
    if (!loadedSnap) {
      return;
    }

    const playerState = loadedSnap.players.find(p => p.playerTitle === title);

    if (playerState) {
      if (playerState.isPlaying) {
        setIsPlaying(true);
        setStopAll(false);
        setFilterValue(playerState.filter || 1800);
        setVolValue(playerState.volume || 1.5);
        setPlaybackRate(playerState.speed || 1);
        play(null, sourcePath, custom);
      } else {
        setIsPlaying(false);
        stop();
      }
    } else {
      setIsPlaying(false);
      stop();
    }
  }, [savedSnaps, loadASnap, playingSnap, stopAll]);
  //  PERLIN --------------------------------------
  function startPerlinModulation(minGain = 0, maxGain = 1.5) {
    if (!gainNodeRef.current || !audioCtxRef.current) return;

    // Clear d'abord pour éviter les doublons
    if (modulatorIntervalRef.current) {
      clearInterval(modulatorIntervalRef.current);
    }

    console.log(`Starting Perlin noise with range [${minGain}, ${maxGain}]`);
    let t = 0;
    const speed = 0.005;

    modulatorIntervalRef.current = setInterval(() => {
      const noise = perlinNoise(t);
      const mapped = (noise + 1) / 2;
      const newGain = minGain + mapped * (maxGain - minGain);

      gainNodeRef.current.gain.setTargetAtTime(
        newGain,
        audioCtxRef.current.currentTime,
        0.05
      );
      // console.log('Perlin modulation → value:', newGain.toFixed(2));

      t += speed;
    }, 50);
  }

  // STOP PERLIN --------------------------------------
  function stopPerlinModulation() {
    if (modulatorIntervalRef.current) {
      clearInterval(modulatorIntervalRef.current);
      modulatorIntervalRef.current = null;
    }
  }

  // FILTER ----------------------------------------
  const handleFilterValue = e => {
    const value = parseFloat(e.currentTarget.value);
    setFilterValue(value);
    registerPlayerSituation(title, { filter: value });

    if (loadASnap) {
      setLoadASnap(false);
    }
    if (filterRef.current && audioCtxRef.current) {
      filterRef.current.frequency.setTargetAtTime(
        value,
        audioCtxRef.current.currentTime,
        0.01
      );
    }
  };

  // VOLUME ----------------------------------------
  const handleVolValue = e => {
    const value = parseFloat(e.currentTarget.value) / 100;
    setVolValue(value);
    registerPlayerSituation(title, { volume: value });

    if (loadASnap) {
      setLoadASnap(false);
    }
    if (custom === 'perlinNoise' && isPlaying) {
      if (value === 0) {
        stopPerlinModulation();
        if (gainNodeRef.current && audioCtxRef.current) {
          gainNodeRef.current.gain.setTargetAtTime(
            0,
            audioCtxRef.current.currentTime,
            0.01
          );
        }
      } else {
        startPerlinModulation(
          0.5 * normalizationFactor,
          value * normalizationFactor
        );
      }
    } else {
      if (gainNodeRef.current && audioCtxRef.current) {
        gainNodeRef.current.gain.setTargetAtTime(
          value * normalizationFactor,
          audioCtxRef.current.currentTime,
          0.01
        );
      }
    }
  };

  // SPEED ----------------------------------------
  const handlePlaybackRateChange = e => {
    if (loadASnap) {
      setLoadASnap(false);
    }
    const value = parseFloat(e.currentTarget.value);
    setPlaybackRate(value);
    registerPlayerSituation(title, { speed: value });
    if (sourceNodeRef.current && audioCtxRef.current) {
      sourceNodeRef.current.playbackRate.setTargetAtTime(
        value,
        audioCtxRef.current.currentTime,
        0.01
      );
    }
  };

  // PLAY ----------------------------------------
  async function play(event, sourcePath, custom) {
    if (isPlaying && event?.target?.dataset?.stop) {
      registerPlayerSituation(title, { isPlaying: false });
      setIsPlaying(false);
      stop();
      return;
    }
    if (isPlaying) {
      return;
    }
    setIsPlaying(true);
    setStopAll(false);
    registerPlayerSituation(title, {
      isPlaying: true,
      volume: volValue,
      filter: filterValue,
      speed: playbackRate,
    });

    if (sourcePath) {
      await playFromSource(sourcePath, custom);

      return;
    }

    if (audioCtxRef.current) return;

    setNormalizationFactor(1); // Reset for noise

    const { gainNode, audioCtx, noiseSource } =
      soundTools.noise.createWhiteNoise(audioCtxRef, noiseSourceRef);

    gainNode.gain.setValueAtTime(volValue, audioCtx.currentTime);
    gainNodeRef.current = gainNode;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterValue, audioCtx.currentTime);
    filterRef.current = filter;

    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    noiseSource.connect(filter);
    noiseSource.start();
    setIsLoading(false);

    // Ici aussi, si bruit blanc + perlin activé
    if (custom === 'perlinNoise') {
      startPerlinModulation(0.5, volValue);
    }
  }
  // PLAY FROM SOURCE ------------------------------
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

      // Normalisation du volume
      const rms = getRMS(audioBuffer);
      const targetRMS = 0.1; // Cible de volume. Ajustable au besoin.
      const newNormalizationFactor = rms > 0 ? targetRMS / rms : 1;
      setNormalizationFactor(newNormalizationFactor);

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
      bufferSource.playbackRate.value = playbackRate;

      // Gain
      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(
        volValue * newNormalizationFactor,
        audioCtx.currentTime
      );

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
      // Ici aussi, perlin activé
      if (custom === 'perlinNoise') {
        startPerlinModulation(
          0.5 * newNormalizationFactor,
          volValue * newNormalizationFactor
        );
      }
      setIsLoading(false);
    } catch (err) {
      console.error('Erreur lors de la lecture du fichier :', err);
    }
  }

  // STOP -------------------------------------------------
  function stop() {
    setIsPlaying(false);
    setIsStereo(false);

    if (loadASnap) {
      setLoadASnap(false);
    }
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

  // STEREO ------------------------------------------------
  function toggleStereoEffect() {
    const audioCtx = audioCtxRef.current;
    const filter = filterRef.current;
    const gainNode = gainNodeRef.current;

    if (!audioCtx || !filter || !gainNode) return;

    if (isStereo) {
      // Disable stereo
      const { merger } = stereoNodesRef.current;

      filter.disconnect();
      merger.disconnect();

      // Reconnect filter directly to gainNode
      filter.connect(gainNode);

      setIsStereo(false);
      stereoNodesRef.current = null;
    } else {
      // Enable stereo
      filter.disconnect();

      const stereoNodes = applyStereoDelayRight(audioCtx, filter);
      stereoNodesRef.current = stereoNodes;

      stereoNodes.merger.connect(gainNode);

      setIsStereo(true);
    }
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

    return { splitter, delayRight, merger };
  }

  // REFRESH -----------------------------------------------
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
        isPlaying
          ? ' player-container is-playing playing expand'
          : 'player-container'
      }
      onClick={event => play(event, sourcePath, custom)}
    >
      <h3 className={isPlaying ? 'playing' : ''}>
        <PlayerTitle title={title} isPlaying={isPlaying} />
      </h3>
      {isPlaying &&
        (isLoading ? (
          <i class="fa-solid fa-spinner loader"></i>
        ) : (
          <div className="main-container">
            {isPlaying && (
              <div className="sliders-container">
                <div className="sliders-labels">
                  <span>
                    <i
                      className={
                        isPlaying
                          ? 'fa-solid fa-filter playing'
                          : 'fa-solid fa-filter'
                      }
                    ></i>
                  </span>

                  <span>
                    <i
                      className={
                        isPlaying
                          ? 'fa-solid fa-volume-high playing'
                          : 'fa-solid fa-volume-high'
                      }
                    ></i>
                  </span>
                  {speed && (
                    <span>
                      <i
                        className={
                          isPlaying
                            ? 'fa-solid fa-gauge-high playing'
                            : 'fa-solid fa-gauge-high'
                        }
                      ></i>
                    </span>
                  )}
                </div>
                <div className="sliders">
                  <input
                    className="noise-range"
                    type="range"
                    min="50"
                    max="1500"
                    step="10"
                    onChange={handleFilterValue}
                    value={filterValue}
                  />
                  <input
                    className="vol-range"
                    type="range"
                    min="0"
                    max="150"
                    step="1"
                    value={volValue * 100}
                    onChange={handleVolValue}
                  />
                  {speed && (
                    <input
                      className="speed-range"
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={playbackRate}
                      onChange={handlePlaybackRateChange}
                    />
                  )}
                </div>
              </div>
            )}

            <div className="btn-container">
              {isPlaying && (
                <>
                  <button onClick={stop} data-stop={true}>
                    <i
                      className="fa-solid fa-pause playing"
                      data-stop={true}
                    ></i>
                  </button>
                  <button onClick={toggleStereoEffect}>
                    <i
                      className={`fa-solid ${
                        isStereo ? 'fa-check-double' : 'fa-check'
                      } playing`}
                    ></i>
                  </button>
                  {custom == true && (
                    <button onClick={refresh}>
                      <i className="fa-solid fa-arrows-rotate playing"></i>{' '}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}

export default Player;
