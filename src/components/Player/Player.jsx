import { useContext, useEffect, useRef, useState } from 'react';
import '../../App.css';
import { Context } from '../../context/context';
import { config } from '../../ref/random.config';
import { cacheManager } from '../../utils/cacheManager';
import { soundTools } from '../../utils/modulateSound.tools';
import { makePlaylist, perlinNoise, SearchThatSound } from '../../utils/utils';
import { PlayerTitle } from '../PlayerTitle/PlayerTitle';
import './styles.css'; // Import local styles

function Player({ title, sourcePath, custom, speed, stopAll }) {
  const {
    registerPlayerSituation,
    savedSnaps,
    loadASnap,
    setLoadASnap,
    playingSnap,
    setStopAll,
    randomSnap,
    setNotification,
    playlist,
    setPlaylist,
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
  const normalizationFactorRef = useRef(1);

  // Ref to hold the latest playlist state for the onended handler
  const playlistRef = useRef(playlist);
  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  const stereoNodesRef = useRef(null);

  const { setCustomSound } = useContext(Context);

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
          title,
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
      if (playerState.isPlaying === true) {
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
          stop();
        } else {
          stop();
        }
      }
    } else {
      if (isPlaying) {
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

  const initAudioContext = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext ||
        window.webkitAudioContext)();
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
    // Initialize and resume AudioContext on user gesture
    initAudioContext();
    if (audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    if (isPlaying && event?.target?.dataset?.stop) {
      registerPlayerSituation(title, { isPlaying: false });
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
      volume: newVol,
      filter: newFilter,
      speed: newSpeed,
    });

    if (sourcePath) {
      await playFromSource(sourcePath, custom, newVol, newFilter, newSpeed);

      return;
    }

    if (audioCtxRef.current) {
      const { gainNode, audioCtx, noiseSource } =
        soundTools.noise.createWhiteNoise(audioCtxRef, noiseSourceRef);

      gainNode.gain.setValueAtTime(newVol, audioCtx.currentTime);
      gainNodeRef.current = gainNode;

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(newFilter, audioCtx.currentTime);
      filterRef.current = filter;

      // Chaînage avec le limiteur
      filter.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      noiseSource.connect(filter);
      noiseSource.start();
      setIsLoading(false);

      // Ici aussi, si bruit blanc + perlin activé
      if (custom === 'perlinNoise') {
        startPerlinModulation(0.5, newVol);
      }
    }
  }

  // PLAY FROM SOURCE ------------------------------
  async function playFromSource(
    sourcePathOrBuffer, // Peut être : AudioBuffer / ArrayBuffer / string
    custom,
    newVol = volValue,
    newFilter = filterValue,
    newSpeed = playbackRate,
    noApiNeeded
  ) {
    const audioCtx = audioCtxRef.current;
    if (!audioCtx) {
      console.error('AudioContext not initialized. Cannot play sound.');
      return;
    }

    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB

    let audioBuffer;

    try {
      if (sourcePathOrBuffer instanceof AudioBuffer) {
        audioBuffer = sourcePathOrBuffer;
      } else if (noApiNeeded) {
        const response = await fetch(sourcePathOrBuffer);
        if (!response.ok) {
          throw new Error(
            `Audio fetch failed: ${response.status} ${response.statusText}`
          );
        }
        const size = response.headers.get('content-length');
        if (size && parseInt(size, 10) > MAX_FILE_SIZE) {
          const track = playlist.find(t => t.url === sourcePathOrBuffer);
          const trackId = track ? track.id : 'unknown';
          throw new Error(
            `Sound ID ${trackId} is too large (> ${
              MAX_FILE_SIZE / 1024 / 1024
            }MB)`
          );
        }
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      } else if (sourcePathOrBuffer instanceof ArrayBuffer) {
        if (sourcePathOrBuffer.byteLength > MAX_FILE_SIZE) {
          throw new Error(
            `File too large to play (> ${MAX_FILE_SIZE / 1024 / 1024}MB)`
          );
        }
        audioBuffer = await audioCtx.decodeAudioData(
          sourcePathOrBuffer.slice(0)
        );
      } else if (sourcePath === 'apiSearch') {
        const playerConfig = config.find(x => x.title == title);
        const arrayOfId = playerConfig.apiSuggestions;
        const playlistOfIds = makePlaylist(arrayOfId);
        const playlist = [];

        for (let i = 0; i < playlistOfIds.length; i++) {
          const soundId = playlistOfIds[i];
          const { obj } = await SearchThatSound(soundId);
          playlist.push({
            id: soundId,
            title: obj.title,
            author: obj.author,
            url: obj.url,
            isCurrent: i === 0,
          });
        }

        setPlaylist(playlist);

        const firstTrack = playlist.find(p => p.isCurrent);
        if (!firstTrack) {
          throw new Error('Could not find first track in playlist.');
        }

        const response = await fetch(firstTrack.url);
        if (!response.ok) {
          throw new Error(
            `Audio fetch failed for apiSearch: ${response.status} ${response.statusText}`
          );
        }
        const size = response.headers.get('content-length');
        if (size && parseInt(size, 10) > MAX_FILE_SIZE) {
          throw new Error(
            `Sound ID ${firstTrack.id} is too large (> ${
              MAX_FILE_SIZE / 1024 / 1024
            }MB)`
          );
        }
        const arrayBuffer = await response.arrayBuffer();
        audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        setNotification({
          message: `Now playing "${firstTrack.title}" by ${firstTrack.author}`,
        });
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      } else {
        throw new Error(`Invalid source type: ${typeof sourcePathOrBuffer}`);
      }

      // Stop and clean up previous source if it exists
      if (sourceNodeRef.current) {
        sourceNodeRef.current.onended = null;
        try {
          sourceNodeRef.current.stop();
        } catch (e) {}
        sourceNodeRef.current.disconnect();
      }
      if (filterRef.current) filterRef.current.disconnect();
      if (gainNodeRef.current) gainNodeRef.current.disconnect();

      // Create new audio graph
      const sourceNode = audioCtx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.loop = sourcePath !== 'apiSearch' && title !== 'bowl';
      sourceNode.playbackRate.setValueAtTime(newSpeed, audioCtx.currentTime);

      if (sourcePath === 'apiSearch') {
        sourceNode.onended = () => {
          if (sourceNode.loop === false) {
            refresh();
          }
        };
      }

      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(
        isFinite(newVol) ? newVol : volValue,
        audioCtx.currentTime
      );

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(newFilter, audioCtx.currentTime);

      sourceNode.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      sourceNode.start();

      sourceNodeRef.current = sourceNode;
      gainNodeRef.current = gainNode;
      filterRef.current = filter;

      if (custom === 'perlinNoise') {
        startPerlinModulation(0.5, isFinite(newVol) ? newVol : volValue);
      }

      setIsLoading(false);
    } catch (error) {
      console.error(`[${title}] FATAL ERROR in playFromSource:`, error);
      setNotification({ message: error.message });
      setTimeout(() => setNotification(null), 5000);
      setIsLoading(false);
      setIsPlaying(false);
    }
  }

  // STOP -------------------------------------------------
  function stop() {
    setIsPlaying(false);
    setIsStereo(false);

    if (loadASnap) {
      setLoadASnap(false);
    }

    // Stop and disconnect the main sound source
    if (sourceNodeRef.current) {
      sourceNodeRef.current.onended = null; // Prevent onended from firing on manual stop
      try {
        sourceNodeRef.current.stop();
      } catch (e) {
        // stop() can throw if already stopped or not started
      }
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (noiseSourceRef.current) {
      try {
        noiseSourceRef.current.stop();
      } catch (e) {}
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

    // We no longer close the audio context here to allow reuse
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
    const currentPlaylist = playlistRef.current;
    const currentIndex = currentPlaylist.findIndex(x => x.isCurrent);

    if (currentIndex === -1) {
      // This can happen if the playlist is empty or state is weird
      return;
    }

    // Resume context if it was suspended (e.g., tab was inactive)
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      await audioCtxRef.current.resume();
    }

    const nextIndex = (currentIndex + 1) % currentPlaylist.length; // Loop back to start

    const updatedPlaylist = currentPlaylist.map((track, index) => ({
      ...track,
      isCurrent: index === nextIndex,
    }));

    setPlaylist(updatedPlaylist);

    const nextTrack = updatedPlaylist[nextIndex];

    setNotification({
      message: `Now playing "${nextTrack.title}" by ${nextTrack.author}`,
    });
    setTimeout(() => {
      setNotification(null);
    }, 3000);

    setCustomSound(nextTrack);

    // No longer calling stop(). playFromSource handles the transition.
    // isPlaying state remains true.
    await playFromSource(
      nextTrack.url,
      null,
      volValue,
      filterValue,
      playbackRate,
      true
    );
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
                  <button onClick={stop} data-stop={true}>
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
                      <i className="fa-solid fa-forward playing"></i>{' '}
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
