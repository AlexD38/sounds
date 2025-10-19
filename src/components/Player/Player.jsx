import { useContext, useEffect, useRef, useState } from 'react';
import '../../App.css';
import { Context } from '../../context/context';
import { config } from '../../ref/random.config';
import { soundTools } from '../../utils/modulateSound.tools';
import { perlinNoise, SearchThatSound } from '../../utils/utils';
import { PlayerTitle } from '../PlayerTitle/PlayerTitle';
import './styles.css'; // Import local styles
import { cacheManager } from '../../utils/cacheManager';

function Player({ title, sourcePath, custom, speed, stopAll }) {
  const {
    snapshotMix,
    registerPlayerSituation,
    savedSnaps,
    loadASnap,
    setLoadASnap,
    playingSnap,
    setStopAll,
    randomSnap,
    setRandomSnap,
  } = useContext(Context);

  const [filterValue, setFilterValue] = useState(1800);
  const [volValue, setVolValue] = useState(1.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isStereo, setIsStereo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [bowlInterval, setBowlInterval] = useState(5000);

  const audioCtxRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const noiseSourceRef = useRef(null);
  const gainNodeRef = useRef(null);
  const filterRef = useRef(null);
  const modulatorIntervalRef = useRef(null);
  const limiterNodeRef = useRef(null); // Ajout de la ref pour le limiteur
  const normalizationFactorRef = useRef(1);

  const stereoNodesRef = useRef(null);
  const token = import.meta.env.VITE_API_KEY;

  const { customSound, setCustomSound, currentInput, setCurrentInput } =
    useContext(Context);

  // On stocke les paramètres dans des refs pour y accéder dans le setInterval sans redéclencher l'effet
  const paramsRef = useRef({
    volValue,
    filterValue,
    playbackRate,
    sourcePath,
    custom,
  });

  useEffect(() => {
    paramsRef.current = {
      volValue,
      filterValue,
      playbackRate,
      sourcePath,
      custom,
    };
  });

  useEffect(() => {
    if (title !== 'bowl' || !isPlaying) {
      return;
    }

    const replaySound = async () => {
      if (!audioCtxRef.current) return;

      // Récupère les paramètres depuis la ref
      const { custom, volValue, filterValue, playbackRate } = paramsRef.current;

      try {
        // ⚡ Récupère l'AudioBuffer décodé depuis le cache
        const audioBuffer = await cacheManager.getDecodedBuffer(
          'chatter',
          audioCtxRef.current
        );
        if (!audioBuffer) return;

        // ⚡ Joue le son
        playFromSource(
          audioBuffer,
          custom,
          volValue,
          filterValue,
          playbackRate
        );
      } catch (err) {
        console.error('Erreur lors du replay du son :', err);
      }
    };

    // Le premier son est joué par le `onClick`. On lance la répétition.
    const intervalId = setInterval(replaySound, bowlInterval);

    return () => {
      clearInterval(intervalId);
    };
  }, [isPlaying, title, bowlInterval]);

  useEffect(() => {
    if (sourcePath == 'apiSearch') {
      handleFilterValue(350);
      handlePlaybackRateChange(0.7);
    }

    if (stopAll) {
      if (isPlaying) {
        fadeOutAndStop(1);
      } else {
        stop();
      }
      return;
    }
    if (!savedSnaps || !loadASnap) {
      return;
    }

    let loadedSnap = savedSnaps.get(playingSnap);

    if (randomSnap) {
      loadedSnap = randomSnap.get(playingSnap);
    }

    if (!loadedSnap) {
      return;
    }

    const playerState = loadedSnap.players.find(p => p.playerTitle === title);

    if (playerState) {
      if (playerState.isPlaying) {
        setStopAll(false);
        const volume = playerState.volume ?? 1.5;
        const filter = playerState.filter ?? 1800;
        const speed = playerState.speed ?? 1;
        setFilterValue(filter);
        setVolValue(volume);
        setPlaybackRate(speed);
        play(null, sourcePath, custom, volume, filter, speed);
        setIsPlaying(true);
      } else {
        if (isPlaying) {
          fadeOutAndStop();
        } else {
          stop();
        }
      }
    } else {
      if (isPlaying) {
        fadeOutAndStop();
      } else {
        stop();
      }
    }
  }, [savedSnaps, loadASnap, playingSnap, stopAll, isPlaying, isLoading]);

  //  PERLIN --------------------------------------
  function startPerlinModulation(minGain = 0, maxGain = 1.5) {
    if (!gainNodeRef.current || !audioCtxRef.current) return;

    // Clear d'abord pour éviter les doublons
    if (modulatorIntervalRef.current) {
      clearInterval(modulatorIntervalRef.current);
    }

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
    const value = parseFloat(e?.currentTarget?.value || e);
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
    const value = parseFloat(e?.currentTarget?.value || e);
    setVolValue(value);
    registerPlayerSituation(title, { volume: value });

    if (loadASnap) {
      setLoadASnap(false);
    }

    const totalGain = value * normalizationFactorRef.current;

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
        startPerlinModulation(0.5, totalGain);
      }
    } else {
      if (gainNodeRef.current && audioCtxRef.current) {
        gainNodeRef.current.gain.setTargetAtTime(
          totalGain,
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
    const value = parseFloat(e?.currentTarget?.value || e);
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
  async function play(
    event,
    sourcePath,
    custom,
    newVol = volValue,
    newFilter = filterValue,
    newSpeed = playbackRate
  ) {
    if (isPlaying && event?.target?.dataset?.stop) {
      registerPlayerSituation(title, { isPlaying: false });
      fadeOutAndStop();
      return;
    }
    if (isPlaying) {
      return;
    }
    setIsPlaying(true);
    setStopAll(false);
    registerPlayerSituation(title, {
      isPlaying: true,
      volume: newVol,
      filter: newFilter,
      speed: newSpeed,
    });

    if (sourcePath) {
      await playFromSource(sourcePath, custom, newVol, newFilter, newSpeed);

      return;
    }

    if (audioCtxRef.current) return;

    const { gainNode, audioCtx, noiseSource } =
      soundTools.noise.createWhiteNoise(audioCtxRef, noiseSourceRef);

    // Création du limiteur pour le bruit blanc
    if (!limiterNodeRef.current) {
      const limiter = audioCtx.createDynamicsCompressor();
      limiter.threshold.setValueAtTime(-2, audioCtx.currentTime);
      limiter.knee.setValueAtTime(0, audioCtx.currentTime);
      limiter.ratio.setValueAtTime(20, audioCtx.currentTime);
      limiter.attack.setValueAtTime(0.005, audioCtx.currentTime);
      limiter.release.setValueAtTime(0.05, audioCtx.currentTime);
      limiterNodeRef.current = limiter;
    }
    const limiter = limiterNodeRef.current;

    gainNode.gain.setValueAtTime(newVol, audioCtx.currentTime);
    gainNodeRef.current = gainNode;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(newFilter, audioCtx.currentTime);
    filterRef.current = filter;

    // Chaînage avec le limiteur
    filter.connect(gainNode);
    gainNode.connect(limiter);
    limiter.connect(audioCtx.destination);

    noiseSource.connect(filter);
    noiseSource.start();
    setIsLoading(false);

    // Ici aussi, si bruit blanc + perlin activé
    if (custom === 'perlinNoise') {
      startPerlinModulation(0.5, newVol);
    }
  }

  // PLAY FROM SOURCE ------------------------------
  async function playFromSource(
    sourcePathOrBuffer, // Peut être : AudioBuffer / ArrayBuffer / string
    custom,
    newVol = volValue,
    newFilter = filterValue,
    newSpeed = playbackRate
  ) {
    try {
      // ✅ Assurer l’existence du contexte audio
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext ||
          window.webkitAudioContext)();
      }
      const audioCtx = audioCtxRef.current;

      let audioBuffer;

      // ✅ 1. Si c’est déjà un AudioBuffer
      if (sourcePathOrBuffer instanceof AudioBuffer) {
        audioBuffer = sourcePathOrBuffer;

        // ✅ 2. Si c’est un ArrayBuffer brut → décodage
      } else if (sourcePathOrBuffer instanceof ArrayBuffer) {
        audioBuffer = await audioCtx.decodeAudioData(
          sourcePathOrBuffer.slice(0)
        );

        // ✅ 3. Si c’est un chemin (string) → fetch + décodage
      } else if (sourcePath === 'apiSearch') {
        const playerConfig = config.find(x => x.title == title);
        const category = playerConfig.category;
        const additionalApiParams = playerConfig.additionalApiFields || null;
        const arrayOfQuery = playerConfig.apiSuggestions;
        const randomIndex = Math.floor(Math.random() * arrayOfQuery.length);
        const { obj } = await SearchThatSound(
          arrayOfQuery[randomIndex],
          category,
          additionalApiParams
        );

        const response = await fetch(obj.url);
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      } else {
        console.error(
          'playFromSource: besoin d’un AudioBuffer, ArrayBuffer ou string (URL)!'
        );
        return;
      }

      // ✅ Stopper l’ancienne source si elle existe
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch (e) {}
      }

      // BufferSource
      const sourceNode = audioCtx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.loop = title !== 'bowl';
      sourceNode.playbackRate.setValueAtTime(newSpeed, audioCtx.currentTime);

      // Gain
      const gainNode = audioCtx.createGain();
      const finalGain = isFinite(newVol) ? newVol : volValue;
      gainNode.gain.setValueAtTime(finalGain, audioCtx.currentTime);

      // Filtre
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(newFilter, audioCtx.currentTime);

      // Chaînage
      sourceNode.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      // Start
      sourceNode.start();

      // Refs
      sourceNodeRef.current = sourceNode;
      gainNodeRef.current = gainNode;
      filterRef.current = filter;

      if (custom === 'perlinNoise') {
        startPerlinModulation(0.5, finalGain);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Erreur lors de la lecture du fichier :', err);
    }
  }

  // FADE OUT AND STOP ------------------------------------
  function fadeOutAndStop(fadeDuration) {
    if (
      !gainNodeRef.current ||
      !audioCtxRef.current ||
      audioCtxRef.current.state === 'closed' ||
      !isPlaying
    ) {
      stop(); // Fallback for safety
      return;
    }

    const now = audioCtxRef.current.currentTime;
    const fadeOutTime = fadeDuration || 0.2; // Default to 1.5 seconds

    gainNodeRef.current.gain.linearRampToValueAtTime(0.0001, now + fadeOutTime);

    stopPerlinModulation();

    setTimeout(() => {
      stop();
    }, fadeOutTime * 1000);
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
    // Déconnexion du limiteur
    if (limiterNodeRef.current) {
      limiterNodeRef.current.disconnect();
      limiterNodeRef.current = null;
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
    setIsLoading(true);
    const playerConfig = config.find(x => x.title == title);
    const category = playerConfig.category;
    const additionalApiParams = playerConfig.additionalApiFields || null;
    const arrayOfQuery = playerConfig.apiSuggestions;
    const randomIndex = Math.floor(Math.random() * arrayOfQuery.length);
    const { obj } = await SearchThatSound(
      arrayOfQuery[randomIndex],
      category,
      additionalApiParams
    );

    setCustomSound(obj);
    setIsLoading(true);
    stop();
    playFromSource(obj.url, null, volValue, filterValue, playbackRate);
    setIsPlaying(true);
    setIsLoading(false);
  };

  return (
    <div
      data-stop={true}
      className={
        isPlaying
          ? ' player-container is-playing playing expand'
          : 'player-container'
      }
      onClick={event =>
        play(event, sourcePath, custom, volValue, filterValue, playbackRate)
      }
    >
      <h3 className={isPlaying ? 'playing' : ''}>
        <PlayerTitle title={title} isPlaying={isPlaying} />
      </h3>
      {title == 'bowl' && isPlaying && (
        <span key={bowlInterval} className="interval-value fade-out">
          (on repeat every {(bowlInterval / 1000).toFixed(1)}s)
        </span>
      )}
      {isPlaying &&
        (isLoading ? (
          <i className="fa-solid fa-spinner loader"></i>
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
                  {title === 'bowl' && isPlaying && (
                    <span>
                      <i className="fa-solid fa-clock playing"></i>
                    </span>
                  )}
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
                  {title === 'bowl' && isPlaying && (
                    <>
                      <input
                        className="interval-range"
                        type="range"
                        min="3000"
                        max="20000"
                        step="100"
                        value={bowlInterval}
                        onChange={e => setBowlInterval(Number(e.target.value))}
                      />
                    </>
                  )}
                  <input
                    className="vol-range"
                    type="range"
                    min="0"
                    max="2"
                    step="0.01"
                    value={volValue}
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
                  <button onClick={fadeOutAndStop} data-stop={true}>
                    <i
                      className="fa-solid fa-pause playing"
                      data-stop={true}
                    ></i>
                  </button>
                  {title !== 'bowl' && (
                    <button onClick={toggleStereoEffect}>
                      <i
                        className={`fa-solid ${
                          isStereo ? 'fa-check-double' : 'fa-check'
                        } playing`}
                      ></i>
                    </button>
                  )}
                  {sourcePath == 'apiSearch' && (
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
