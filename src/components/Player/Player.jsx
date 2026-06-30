import { useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '../../App.css';
import { Context } from '../../context/context';
import { config } from '../../ref/random.config';
import { makePlaylist, perlinNoise, SearchThatSound } from '../../utils/utils';
import { formatPlayerLabel } from '../../utils/formatPlayerLabel';
import { PlayerTitle } from '../PlayerTitle/PlayerTitle';
import './styles.css'; // Import local styles

const FADE_OUT_DURATION = 2.5;
const FADE_IN_DURATION = 2.5;

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
    mixTransition,
  } = useContext(Context);

  const [filterValue, setFilterValue] = useState(1800);
  const [volValue, setVolValue] = useState(1.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isStereo, setIsStereo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reverbValue, setReverbValue] = useState(0.3); // 0 to 1 (wet level)
  const [reverbDuration, setReverbDuration] = useState(2.5); // seconds
  const [indicatorText, setIndicatorText] = useState('');
  const [showIndicator, setShowIndicator] = useState(false);
  const indicatorTimerRef = useRef(null);
  const [bowlInterval, setBowlInterval] = useState(5000);

  const audioCtxRef = useRef(null);
  const audioBufferRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const noiseSourceRef = useRef(null);
  const gainNodeRef = useRef(null);
  const filterRef = useRef(null);
  const reverbNodeRef = useRef(null);
  const reverbGainNodeRef = useRef(null);
  const modulatorIntervalRef = useRef(null);
  const isFadingRef = useRef(false);
  const fadeTimeoutRef = useRef(null);
  const perlinFadeTimerRef = useRef(null);
  const playbackGenerationRef = useRef(0);
  const [portalTarget, setPortalTarget] = useState(null);

  // Ref to hold the latest playlist state for the onended handler
  const playlistRef = useRef(playlist);
  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  const stereoNodesRef = useRef(null);
  const savedSnapsRef = useRef(savedSnaps);
  const randomSnapRef = useRef(randomSnap);
  const isPlayingRef = useRef(isPlaying);
  const mixTransitionRef = useRef(mixTransition);

  const { setCustomSound } = useContext(Context);

  useEffect(() => {
    savedSnapsRef.current = savedSnaps;
  }, [savedSnaps]);

  useEffect(() => {
    randomSnapRef.current = randomSnap;
  }, [randomSnap]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    mixTransitionRef.current = mixTransition;
  }, [mixTransition]);

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      if (perlinFadeTimerRef.current) clearTimeout(perlinFadeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    setPortalTarget(document.getElementById('active-mix-portal'));
  }, []);

  function invalidatePlayback() {
    playbackGenerationRef.current += 1;
  }

  function isPlaybackCancelled(generation) {
    return generation !== playbackGenerationRef.current;
  }

  function clearSourceOnEnded() {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.onended = null;
    }
  }

  const triggerIndicator = text => {
    setIndicatorText(text);
    setShowIndicator(true);
    if (indicatorTimerRef.current) clearTimeout(indicatorTimerRef.current);
    indicatorTimerRef.current = setTimeout(() => {
      setShowIndicator(false);
    }, 1000);
  };

  // On stocke les paramètres dans des refs pour y accéder dans le setInterval sans redéclencher l'effet
  const paramsRef = useRef({
    volValue,
    filterValue,
    playbackRate,
    sourcePath,
    custom,
    reverbValue,
    reverbDuration,
  });

  useEffect(() => {
    paramsRef.current = {
      volValue,
      filterValue,
      playbackRate,
      sourcePath,
      custom,
      reverbValue,
      reverbDuration,
    };
  }, [
    volValue,
    filterValue,
    playbackRate,
    sourcePath,
    custom,
    reverbValue,
    reverbDuration,
  ]);

  // Génère une réponse impulsionnelle synthétique pour la reverb
  const createImpulseResponse = (audioCtx, duration = 2.5, decay = 2.0) => {
    const sampleRate = audioCtx.sampleRate;
    const length = sampleRate * duration;
    const impulse = audioCtx.createBuffer(2, length, sampleRate);
    for (let i = 0; i < 2; i++) {
      const channelData = impulse.getChannelData(i);
      for (let j = 0; j < length; j++) {
        channelData[j] =
          (Math.random() * 2 - 1) * Math.pow(1 - j / length, decay);
      }
    }
    return impulse;
  };

  useEffect(() => {
    if (title !== 'bowl' || !isPlaying) {
      return;
    }

    const replaySound = async () => {
      if (!audioCtxRef.current) return;

      // Récupère les paramètres depuis la ref
      const { sourcePath, custom, volValue, filterValue, playbackRate } =
        paramsRef.current;

      try {
        await playFromSource(
          sourcePath,
          custom,
          volValue,
          filterValue,
          playbackRate,
          false,
          playbackGenerationRef.current
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, title, bowlInterval]);

  useEffect(() => {
    if (sourcePath === 'apiSearch') {
      handleFilterValue(350);
      handlePlaybackRateChange(0.7);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stopAll && isPlayingRef.current) {
      stop();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopAll]);

  useEffect(() => {
    if (!loadASnap || stopAll) {
      return;
    }

    const snaps =
      savedSnapsRef.current instanceof Map
        ? savedSnapsRef.current
        : new Map(savedSnapsRef.current ?? []);

    let loadedSnap = snaps.get(playingSnap);

    if (randomSnapRef.current instanceof Map) {
      loadedSnap = randomSnapRef.current.get(playingSnap);
    }

    if (!loadedSnap) {
      return;
    }

    const playerState = loadedSnap.players.find(p => p.playerTitle === title);

    if (playerState?.isPlaying === true) {
      setStopAll(false);
      const volume = playerState.volume ?? 1.5;
      const filter = playerState.filter ?? 1800;
      const speed = playerState.speed ?? 1;
      setFilterValue(filter);
      setVolValue(volume);
      setPlaybackRate(speed);
      if (isPlayingRef.current) {
        crossfadeParams(volume, filter, speed);
      } else {
        play(null, sourcePath, custom, volume, filter, speed);
      }
    } else if (isPlayingRef.current) {
      stop({ fade: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadASnap, playingSnap, stopAll]);

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
        startPerlinModulation(0.5, value);
      }
    } else {
      if (gainNodeRef.current && audioCtxRef.current) {
        // Linear crossfade master volume
        const dryLevel = sourcePath === 'apiSearch' ? 1 - reverbValue : 1;
        gainNodeRef.current.gain.setTargetAtTime(
          value * dryLevel,
          audioCtxRef.current.currentTime,
          0.01
        );

        if (reverbGainNodeRef.current) {
          reverbGainNodeRef.current.gain.setTargetAtTime(
            value * reverbValue,
            audioCtxRef.current.currentTime,
            0.01
          );
        }
      }
    }
  };

  // REVERB ----------------------------------------
  const handleReverbValue = e => {
    const value = parseFloat(e?.currentTarget?.value || e);
    setReverbValue(value);
    triggerIndicator(`Reverb: ${Math.round(value * 100)}%`);

    if (audioCtxRef.current) {
      const audioCtx = audioCtxRef.current;
      const now = audioCtx.currentTime;

      // Update dry/wet mix
      if (gainNodeRef.current) {
        gainNodeRef.current.gain.setTargetAtTime(
          volValue * (1 - value),
          now,
          0.01
        );
      }
      if (reverbGainNodeRef.current) {
        reverbGainNodeRef.current.gain.setTargetAtTime(
          volValue * value,
          now,
          0.01
        );
      }
    }
  };

  const handleReverbDuration = e => {
    const value = parseFloat(e?.currentTarget?.value || e);
    setReverbDuration(value);
    triggerIndicator(`Room: ${value.toFixed(1)}s`);

    if (audioCtxRef.current && reverbNodeRef.current) {
      // Régénère le buffer de reverb en direct
      const newBuffer = createImpulseResponse(audioCtxRef.current, value);
      reverbNodeRef.current.buffer = newBuffer;
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
      audioCtxRef.current = new (
        window.AudioContext || window.webkitAudioContext
      )();
    }
    return audioCtxRef.current;
  };

  function clearPerlinFadeTimer() {
    if (perlinFadeTimerRef.current) {
      clearTimeout(perlinFadeTimerRef.current);
      perlinFadeTimerRef.current = null;
    }
  }

  function applyGainFadeIn(gainNode, targetValue, audioCtx) {
    const now = audioCtx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(targetValue, now + FADE_IN_DURATION);
  }

  function schedulePerlinAfterFade(generation, maxGain) {
    clearPerlinFadeTimer();
    perlinFadeTimerRef.current = setTimeout(() => {
      perlinFadeTimerRef.current = null;
      if (isPlaybackCancelled(generation)) return;
      startPerlinModulation(0.5, maxGain);
    }, FADE_IN_DURATION * 1000);
  }

  function crossfadeParams(newVol, newFilter, newSpeed) {
    const audioCtx = audioCtxRef.current;
    if (!audioCtx || !gainNodeRef.current || !filterRef.current) {
      play(null, sourcePath, custom, newVol, newFilter, newSpeed);
      return;
    }

    const now = audioCtx.currentTime;
    const dryLevel = sourcePath === 'apiSearch' ? 1 - reverbValue : 1;
    const dryTarget = newVol * dryLevel;
    const generation = playbackGenerationRef.current;

    gainNodeRef.current.gain.cancelScheduledValues(now);
    gainNodeRef.current.gain.setValueAtTime(
      gainNodeRef.current.gain.value,
      now
    );
    gainNodeRef.current.gain.linearRampToValueAtTime(
      dryTarget,
      now + FADE_IN_DURATION
    );

    if (reverbGainNodeRef.current) {
      const wetTarget = newVol * reverbValue;
      reverbGainNodeRef.current.gain.cancelScheduledValues(now);
      reverbGainNodeRef.current.gain.setValueAtTime(
        reverbGainNodeRef.current.gain.value,
        now
      );
      reverbGainNodeRef.current.gain.linearRampToValueAtTime(
        wetTarget,
        now + FADE_IN_DURATION
      );
    }

    filterRef.current.frequency.cancelScheduledValues(now);
    filterRef.current.frequency.setValueAtTime(
      filterRef.current.frequency.value,
      now
    );
    filterRef.current.frequency.linearRampToValueAtTime(
      newFilter,
      now + FADE_IN_DURATION
    );

    if (sourceNodeRef.current) {
      sourceNodeRef.current.playbackRate.cancelScheduledValues(now);
      sourceNodeRef.current.playbackRate.setValueAtTime(
        sourceNodeRef.current.playbackRate.value,
        now
      );
      sourceNodeRef.current.playbackRate.linearRampToValueAtTime(
        newSpeed,
        now + FADE_IN_DURATION
      );
    }

    registerPlayerSituation(title, {
      isPlaying: true,
      volume: newVol,
      filter: newFilter,
      speed: newSpeed,
    });

    if (custom === 'perlinNoise') {
      stopPerlinModulation();
      schedulePerlinAfterFade(generation, newVol);
    }
  }

  // PLAY ----------------------------------------
  async function play(
    event,
    sourcePath,
    custom,
    newVol = volValue,
    newFilter = filterValue,
    newSpeed = playbackRate
  ) {
    cancelPendingFade();

    // Initialize and resume AudioContext on user gesture
    const audioCtx = initAudioContext();
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    if (isPlaying && event?.target?.dataset?.stop) {
      registerPlayerSituation(title, { isPlaying: false });
      stop();
      return;
    }
    if (isPlaying) {
      return;
    }
    const generation = ++playbackGenerationRef.current;
    setIsPlaying(true);
    setStopAll(false);
    registerPlayerSituation(title, {
      isPlaying: true,
      volume: newVol,
      filter: newFilter,
      speed: newSpeed,
    });

    await playFromSource(
      sourcePath,
      custom,
      newVol,
      newFilter,
      newSpeed,
      false,
      generation
    );
  }

  async function playFromSource(
    source,
    custom,
    newVol = volValue,
    newFilter = filterValue,
    newSpeed = playbackRate,
    forceReload = false,
    generation = playbackGenerationRef.current
  ) {
    cancelPendingFade();

    if (isPlaybackCancelled(generation)) return;
    const audioCtx = initAudioContext();
    if (audioCtx.state === 'suspended') await audioCtx.resume();

    try {
      if (forceReload) {
        audioBufferRef.current = null;
      }

      let audioBuffer = audioBufferRef.current;

      // Si on n'a pas encore le buffer en cache, on le charge
      if (!audioBuffer) {
        setIsLoading(true);

        // 1. OBTENTION DE L'INSTANCE AUDIO (soit Bruit Blanc, soit API, soit Fichier)
        if (title === 'whiteNoise' || (!source && !custom)) {
          // Génération du bruit blanc via un tableau PCM
          const sr = audioCtx.sampleRate;
          const len = sr * 2; // 2 secondes de boucle
          const data = new Float32Array(len);
          let lastOut = 0.0;
          for (let i = 0; i < len; i++) {
            const white = Math.random() * 2 - 1;
            data[i] = (lastOut + 0.02 * white) / 1.02;
            lastOut = data[i];
            data[i] *= 3.5;
          }
          audioBuffer = audioCtx.createBuffer(1, len, sr);
          audioBuffer.copyToChannel(data, 0);
        } else {
          let audioSource = source;
          if (source === 'apiSearch') {
            const playerConfig = config.find(x => x.title === title);
            const playlistOfIds = makePlaylist(playerConfig.apiSuggestions);
            const newPlaylist = [];

            for (let i = 0; i < playlistOfIds.length; i++) {
              const { obj } = await SearchThatSound(playlistOfIds[i]);
              if (isPlaybackCancelled(generation)) {
                setIsLoading(false);
                return;
              }
              if (!obj?.url) continue;
              newPlaylist.push({
                id: playlistOfIds[i],
                title: obj.title,
                author: obj.author,
                url: obj.url,
                isCurrent: newPlaylist.length === 0,
              });
            }

            if (newPlaylist.length === 0) {
              setNotification({
                message: 'Could not load music from API. Check your API key.',
              });
              setTimeout(() => setNotification(null), 5000);
              setIsLoading(false);
              setIsPlaying(false);
              return;
            }

            if (isPlaybackCancelled(generation)) {
              setIsLoading(false);
              return;
            }

            setPlaylist(newPlaylist);
            const firstTrack = newPlaylist.find(p => p.isCurrent);
            audioSource = firstTrack.url;
            setNotification({
              message: `Now playing "${firstTrack.title}" by ${firstTrack.author}`,
            });
            setTimeout(() => setNotification(null), 3000);
          }

          if (!audioSource) {
            throw new Error('No audio source provided');
          }

          // Chargement et décodage standard
          const response = await fetch(audioSource);
          if (!response.ok) {
            throw new Error(`Failed to load audio (${response.status})`);
          }
          const arrayBuffer = await response.arrayBuffer();
          if (isPlaybackCancelled(generation)) {
            setIsLoading(false);
            return;
          }
          audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        }

        // On met en cache pour la prochaine fois (sauf si c'est du bruit blanc régénéré ou API dynamique)
        if (source !== 'apiSearch') {
          audioBufferRef.current = audioBuffer;
        }
      }

      if (isPlaybackCancelled(generation)) {
        setIsLoading(false);
        return;
      }

      // 3. NETTOYAGE DES ANCIENS NOEUDS
      if (sourceNodeRef.current) {
        sourceNodeRef.current.onended = null;
        try {
          sourceNodeRef.current.stop();
        } catch {
          // stop() can throw if already stopped
        }
        sourceNodeRef.current.disconnect();
      }
      if (filterRef.current) filterRef.current.disconnect();
      if (gainNodeRef.current) gainNodeRef.current.disconnect();
      if (reverbNodeRef.current) reverbNodeRef.current.disconnect();
      if (reverbGainNodeRef.current) reverbGainNodeRef.current.disconnect();

      // 4. CRÉATION DU GRAPHE AUDIO
      const sourceNode = audioCtx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.loop = source !== 'apiSearch' && title !== 'bowl';
      sourceNode.playbackRate.setValueAtTime(newSpeed, audioCtx.currentTime);

      if (source === 'apiSearch') {
        sourceNode.onended = () => {
          if (isPlaybackCancelled(generation)) return;
          refresh();
        };
      }

      const gainNode = audioCtx.createGain();
      const dryLevel = source === 'apiSearch' ? 1 - reverbValue : 1;
      const dryTarget = newVol * dryLevel;
      applyGainFadeIn(gainNode, dryTarget, audioCtx);

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(newFilter, audioCtx.currentTime);

      sourceNode.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      // Reverb path pour les sons API
      if (source === 'apiSearch') {
        const reverbNode = audioCtx.createConvolver();
        reverbNode.buffer = createImpulseResponse(audioCtx, reverbDuration);
        const reverbGainNode = audioCtx.createGain();
        const wetTarget = newVol * reverbValue;
        applyGainFadeIn(reverbGainNode, wetTarget, audioCtx);

        filter.connect(reverbNode);
        reverbNode.connect(reverbGainNode);
        reverbGainNode.connect(audioCtx.destination);

        reverbNodeRef.current = reverbNode;
        reverbGainNodeRef.current = reverbGainNode;
      }

      if (isPlaybackCancelled(generation)) {
        setIsLoading(false);
        return;
      }

      sourceNode.start();
      sourceNodeRef.current = sourceNode;
      gainNodeRef.current = gainNode;
      filterRef.current = filter;

      if (custom === 'perlinNoise') {
        schedulePerlinAfterFade(generation, newVol);
      }
      setIsLoading(false);
    } catch (error) {
      console.error(`[${title}] Error in playFromSource:`, error);
      setNotification({ message: error.message });
      setTimeout(() => setNotification(null), 5000);
      setIsLoading(false);
      setIsPlaying(false);
    }
  }

  // STOP -------------------------------------------------
  function cancelPendingFade() {
    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
    clearPerlinFadeTimer();
    if (isFadingRef.current) {
      isFadingRef.current = false;
      disconnectAudioNodes();
    }
  }

  function disconnectAudioNodes() {
    clearSourceOnEnded();

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {
        // stop() can throw if already stopped or not started
      }
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (noiseSourceRef.current) {
      try {
        noiseSourceRef.current.stop();
      } catch {
        // stop() can throw if already stopped
      }
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
    if (reverbNodeRef.current) {
      reverbNodeRef.current.disconnect();
      reverbNodeRef.current = null;
    }
    if (reverbGainNodeRef.current) {
      reverbGainNodeRef.current.disconnect();
      reverbGainNodeRef.current = null;
    }

    if (modulatorIntervalRef.current) {
      clearInterval(modulatorIntervalRef.current);
      modulatorIntervalRef.current = null;
    }
  }

  function stop({ fade = true } = {}) {
    invalidatePlayback();

    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
    clearPerlinFadeTimer();
    isFadingRef.current = false;

    setIsLoading(false);
    setIsPlaying(false);
    setIsStereo(false);

    if (loadASnap && !mixTransitionRef.current) {
      setLoadASnap(false);
    }

    registerPlayerSituation(title, { isPlaying: false });
    stopPerlinModulation();

    clearSourceOnEnded();

    const hasActiveAudio =
      sourceNodeRef.current || gainNodeRef.current || noiseSourceRef.current;

    if (!hasActiveAudio) {
      return;
    }

    const shouldFade =
      fade && audioCtxRef.current && gainNodeRef.current && FADE_OUT_DURATION > 0;

    if (!shouldFade) {
      disconnectAudioNodes();
      return;
    }

    isFadingRef.current = true;
    const audioCtx = audioCtxRef.current;
    const now = audioCtx.currentTime;

    if (gainNodeRef.current) {
      gainNodeRef.current.gain.cancelScheduledValues(now);
      gainNodeRef.current.gain.setValueAtTime(
        gainNodeRef.current.gain.value,
        now
      );
      gainNodeRef.current.gain.linearRampToValueAtTime(
        0,
        now + FADE_OUT_DURATION
      );
    }

    if (reverbGainNodeRef.current) {
      reverbGainNodeRef.current.gain.cancelScheduledValues(now);
      reverbGainNodeRef.current.gain.setValueAtTime(
        reverbGainNodeRef.current.gain.value,
        now
      );
      reverbGainNodeRef.current.gain.linearRampToValueAtTime(
        0,
        now + FADE_OUT_DURATION
      );
    }

    fadeTimeoutRef.current = setTimeout(() => {
      isFadingRef.current = false;
      fadeTimeoutRef.current = null;
      disconnectAudioNodes();
    }, FADE_OUT_DURATION * 1000);
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
    if (!isPlayingRef.current) return;

    const generation = playbackGenerationRef.current;
    if (isPlaybackCancelled(generation)) return;

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

    audioBufferRef.current = null;
    await playFromSource(
      nextTrack.url,
      null,
      volValue,
      filterValue,
      playbackRate,
      true,
      generation
    );
  };

  const renderActiveCard = () => (
    <div
      className="active-player-card"
      onClick={e => e.stopPropagation()}
      role="group"
      aria-label={`${formatPlayerLabel(title)} controls`}
    >
      <div className="active-player-card__top">
        <div className="active-player-card__icon-wrap">
          <PlayerTitle title={title} isPlaying={true} />
        </div>
        <div className="active-player-card__meta">
          <p className="active-player-card__title">{formatPlayerLabel(title)}</p>
          {title === 'bowl' && (
            <p className="active-player-card__hint">
              every {(bowlInterval / 1000).toFixed(1)}s
            </p>
          )}
        </div>
        <div className="active-player-card__actions">
          <button
            type="button"
            className="player-control-btn"
            onClick={stop}
            aria-label="Pause"
          >
            <i className="fa-solid fa-pause" aria-hidden="true" />
          </button>
          {title !== 'bowl' && (
            <button
              type="button"
              className={`player-control-btn${isStereo ? ' player-control-btn--active' : ''}`}
              onClick={toggleStereoEffect}
              aria-label="Toggle stereo"
              aria-pressed={isStereo}
            >
              <i
                className={`fa-solid ${isStereo ? 'fa-check-double' : 'fa-check'}`}
                aria-hidden="true"
              />
            </button>
          )}
          {sourcePath === 'apiSearch' && (
            <button
              type="button"
              className="player-control-btn"
              onClick={refresh}
              aria-label="Next track"
            >
              <i className="fa-solid fa-forward" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <i className="fa-solid fa-spinner active-player-card__loader" aria-hidden="true" />
      ) : (
        <>
          <div
            className={`active-player-card__value-indicator${showIndicator ? ' active-player-card__value-indicator--visible' : ''}`}
          >
            {indicatorText}
          </div>
          <div className="active-player-card__sliders">
            <label className="active-player-card__row">
              <span className="active-player-card__row-label">
                <i className="fa-solid fa-filter" aria-hidden="true" />
              </span>
              <input
                className="active-player-card__range"
                type="range"
                min="50"
                max="1500"
                step="10"
                value={filterValue}
                onChange={handleFilterValue}
                aria-label="Filter"
              />
            </label>
            {title === 'bowl' && (
              <label className="active-player-card__row">
                <span className="active-player-card__row-label">
                  <i className="fa-solid fa-clock" aria-hidden="true" />
                </span>
                <input
                  className="active-player-card__range"
                  type="range"
                  min="3000"
                  max="20000"
                  step="100"
                  value={bowlInterval}
                  onChange={e => setBowlInterval(Number(e.target.value))}
                  aria-label="Repeat interval"
                />
              </label>
            )}
            {sourcePath === 'apiSearch' && (
              <>
                <label className="active-player-card__row">
                  <span className="active-player-card__row-label">
                    <i className="fa-solid fa-cloud" aria-hidden="true" />
                  </span>
                  <input
                    className="active-player-card__range"
                    type="range"
                    min="0"
                    max="0.8"
                    step="0.01"
                    value={reverbValue}
                    onChange={handleReverbValue}
                    aria-label="Reverb"
                  />
                </label>
                <label className="active-player-card__row">
                  <span className="active-player-card__row-label">
                    <i
                      className="fa-solid fa-arrows-left-right-to-line"
                      aria-hidden="true"
                    />
                  </span>
                  <input
                    className="active-player-card__range"
                    type="range"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={reverbDuration}
                    onChange={handleReverbDuration}
                    aria-label="Reverb room size"
                  />
                </label>
              </>
            )}
            <label className="active-player-card__row">
              <span className="active-player-card__row-label">
                <i className="fa-solid fa-volume-high" aria-hidden="true" />
              </span>
              <input
                className="active-player-card__range"
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={volValue}
                onChange={handleVolValue}
                aria-label="Volume"
              />
            </label>
            {speed && (
              <label className="active-player-card__row">
                <span className="active-player-card__row-label">
                  <i className="fa-solid fa-gauge-high" aria-hidden="true" />
                </span>
                <input
                  className="active-player-card__range"
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={playbackRate}
                  onChange={handlePlaybackRateChange}
                  aria-label="Speed"
                />
              </label>
            )}
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      <div
        data-stop={true}
        className={`player-container${isPlaying ? ' is-active' : ''}`}
        onClick={event =>
          play(event, sourcePath, custom, volValue, filterValue, playbackRate)
        }
      >
        <div className="player-card__head">
          <div className="player-card__icon-wrap">
            <PlayerTitle title={title} isPlaying={isPlaying} />
          </div>
          <span className="player-card__label">{formatPlayerLabel(title)}</span>
        </div>
        {isPlaying && <span className="player-card__active-dot" aria-hidden="true" />}
      </div>
      {isPlaying &&
        portalTarget &&
        createPortal(renderActiveCard(), portalTarget)}
    </>
  );
}

export default Player;
