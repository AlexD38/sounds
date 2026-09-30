import { useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import '../../App.css';
import { Context } from '../../context/context';
import { config } from '../../ref/random.config';
import {
  connectToMasterBus,
  getSharedAudioContext,
  resumeSharedAudioContext,
} from '../../utils/masterBus';
import { makePlaylist, perlinNoise, SearchThatSound } from '../../utils/utils';
import {
  buildWindLayerGraph,
  createWindNoiseBuffer,
  DEFAULT_WIND_PARAMS,
  disconnectWindLayerGraph,
  isWindCreator as checkIsWindCreator,
  mergeWindParams,
  serializeWindParams,
  startWindModulation,
  WIND_DEFAULT_FILTER,
  WIND_GLOBAL_SLIDERS,
  WIND_LAYER_SLIDERS,
  WIND_MIN_GAIN,
} from '../../utils/windCreator';
import {
  buildPanOnlyChain,
  buildSpatialChain,
} from '../../utils/spatialAudio';
import { cacheManager } from '../../utils/cacheManager';
import { stretchAudioBuffer } from '../../utils/stretchBuffer';
import { hasFreesoundApiKey, LOCAL_MUSIC_TRACKS } from '../../ref/localMusic';
import { CROSSFADE_DURATION } from '../../ref/mix.constants';
import { formatPlayerLabel } from '../../utils/formatPlayerLabel';
import { PlayerTitle } from '../PlayerTitle/PlayerTitle';
import { BandFilterSlider } from './BandFilterSlider';
import { WindCreatorSliders } from './WindCreatorSliders';
import './styles.css'; // Import local styles

const FADE_OUT_DURATION = 2.5;
const FADE_IN_DURATION = 2.5;
/** Transparent high-pass default for classic players (Wind has per-layer HP). */
const DEFAULT_HIGHPASS = 20;
const MUSIC_CROSSFADE = CROSSFADE_DURATION;

function Player({ title, sourcePath, custom, speed, stopAll }) {
  const {
    registerPlayerSituation,
    savedSnaps,
    loadASnap,
    setLoadASnap,
    playingSnap,
    setStopAll,
    stopFadeDuration,
    setStopFadeDuration,
    mixFadeDuration,
    randomSnap,
    setNotification,
    playlist,
    setPlaylist,
    mixTransition,
  } = useContext(Context);

  const isWindCreator = checkIsWindCreator(title);
  const isLayeredCreator = isWindCreator;
  const isMusic = title === 'music';
  const [filterValue, setFilterValue] = useState(
    isWindCreator ? WIND_DEFAULT_FILTER : 1800
  );
  const [highpassValue, setHighpassValue] = useState(DEFAULT_HIGHPASS);
  const [volValue, setVolValue] = useState(1.5);
  const filterValueRef = useRef(filterValue);
  const highpassValueRef = useRef(highpassValue);
  const [windParams, setWindParams] = useState(() =>
    mergeWindParams(DEFAULT_WIND_PARAMS)
  );
  const windParamsRef = useRef(windParams);
  const windLayerNodesRef = useRef(null);
  const [stretchEnabled, setStretchEnabled] = useState(false);
  const stretchEnabledRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [panValue, setPanValue] = useState(0);
  const [widthValue, setWidthValue] = useState(0);
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
  const highpassRef = useRef(null);
  const filterRef = useRef(null);
  const reverbNodeRef = useRef(null);
  const reverbGainNodeRef = useRef(null);
  const modulatorIntervalRef = useRef(null);
  const isFadingRef = useRef(false);
  const fadeTimeoutRef = useRef(null);
  const perlinFadeTimerRef = useRef(null);
  const playbackGenerationRef = useRef(0);
  const [portalTarget, setPortalTarget] = useState(null);
  const musicAdvanceTimerRef = useRef(null);
  const musicCrossfadingRef = useRef(false);
  const nextMusicBufferRef = useRef(null);
  const nextMusicUrlRef = useRef(null);

  // Ref to hold the latest playlist state for the onended handler
  const playlistRef = useRef(playlist);
  useEffect(() => {
    playlistRef.current = playlist;
  }, [playlist]);

  const volValueRef = useRef(volValue);
  const playbackRateRef = useRef(playbackRate);
  const reverbValueRef = useRef(reverbValue);
  const reverbDurationRef = useRef(reverbDuration);

  useEffect(() => {
    volValueRef.current = volValue;
  }, [volValue]);
  useEffect(() => {
    playbackRateRef.current = playbackRate;
  }, [playbackRate]);
  useEffect(() => {
    reverbValueRef.current = reverbValue;
  }, [reverbValue]);
  useEffect(() => {
    reverbDurationRef.current = reverbDuration;
  }, [reverbDuration]);

  const stereoNodesRef = useRef(null);
  const spatialChainRef = useRef(null);
  const panValueRef = useRef(0);
  const widthValueRef = useRef(0);
  const savedSnapsRef = useRef(savedSnaps);
  const randomSnapRef = useRef(randomSnap);
  useEffect(() => {
    panValueRef.current = panValue;
  }, [panValue]);
  useEffect(() => {
    widthValueRef.current = widthValue;
  }, [widthValue]);

  const isPlayingRef = useRef(isPlaying);
  const mixTransitionRef = useRef(mixTransition);
  const mixFadeDurationRef = useRef(mixFadeDuration);
  mixFadeDurationRef.current = mixFadeDuration;

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
    filterValueRef.current = filterValue;
  }, [filterValue]);

  useEffect(() => {
    highpassValueRef.current = highpassValue;
  }, [highpassValue]);

  useEffect(() => {
    windParamsRef.current = windParams;
  }, [windParams]);

  useEffect(() => {
    stretchEnabledRef.current = stretchEnabled;
  }, [stretchEnabled]);

  useEffect(() => {
    mixTransitionRef.current = mixTransition;
  }, [mixTransition]);

  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      if (perlinFadeTimerRef.current) clearTimeout(perlinFadeTimerRef.current);
      if (musicAdvanceTimerRef.current) clearTimeout(musicAdvanceTimerRef.current);
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
    highpassValue,
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
      highpassValue,
      playbackRate,
      sourcePath,
      custom,
      reverbValue,
      reverbDuration,
    };
  }, [
    volValue,
    filterValue,
    highpassValue,
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
      const {
        sourcePath,
        custom,
        volValue,
        filterValue,
        highpassValue,
        playbackRate,
      } = paramsRef.current;

      try {
        await playFromSource(
          sourcePath,
          custom,
          volValue,
          filterValue,
          playbackRate,
          false,
          playbackGenerationRef.current,
          highpassValue
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
      const filter = playerState.filter ?? (isWindCreator ? WIND_DEFAULT_FILTER : 1800);
      const highpass = playerState.highpass ?? DEFAULT_HIGHPASS;
      const speed = playerState.speed ?? 1;
      setFilterValue(filter);
      setHighpassValue(highpass);
      setVolValue(volume);
      setPlaybackRate(speed);
      if (isWindCreator && playerState.windParams) {
        const nextWind = mergeWindParams(playerState.windParams);
        setWindParams(nextWind);
        windParamsRef.current = nextWind;
      }
      if (isMusic && playerState.stretch != null) {
        setStretchEnabled(Boolean(playerState.stretch));
        stretchEnabledRef.current = Boolean(playerState.stretch);
      }
      if (playerState.pan != null) {
        setPanValue(playerState.pan);
        panValueRef.current = playerState.pan;
      }
      if (playerState.width != null) {
        setWidthValue(playerState.width);
        widthValueRef.current = playerState.width;
      } else if (playerState.isStereo) {
        setWidthValue(1);
        widthValueRef.current = 1;
      }
      if (isPlayingRef.current) {
        if (isWindCreator && playerState.windParams) {
          const generation = ++playbackGenerationRef.current;
          playFromSource(
            sourcePath,
            custom,
            volume,
            filter,
            speed,
            true,
            generation,
            highpass
          );
        } else {
          crossfadeParams(volume, filter, speed, highpass);
          spatialChainRef.current?.setPan?.(panValueRef.current);
          spatialChainRef.current?.setWidth?.(widthValueRef.current);
        }
      } else {
        play(
          null,
          sourcePath,
          custom,
          volume,
          filter,
          speed,
          highpass,
          mixFadeDurationRef.current
        );
      }
    } else if (isPlayingRef.current) {
      stop({ fade: true, fadeSeconds: mixFadeDurationRef.current });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadASnap, playingSnap, stopAll]);

  //  PERLIN --------------------------------------
  function startPerlinModulation(minGain = 0, maxGain = 1.5, fadeInSeconds) {
    if (!gainNodeRef.current || !audioCtxRef.current) return;

    if (isWindCreator) {
      startWindModulation({
        masterGain: gainNodeRef.current,
        layerNodes: windLayerNodesRef.current,
        audioCtx: audioCtxRef.current,
        maxGain,
        getParams: () => windParamsRef.current,
        intervalRef: modulatorIntervalRef,
        fadeInSeconds,
      });
      return;
    }

    // Clear d'abord pour éviter les doublons
    if (modulatorIntervalRef.current) {
      clearInterval(modulatorIntervalRef.current);
    }

    let t = Math.random() * 100;
    const speed = 0.005;
    const timeConstant = 0.05;
    const baseFilter = filterValueRef.current;

    const now = audioCtxRef.current.currentTime;

    gainNodeRef.current.gain.cancelScheduledValues(now);
    gainNodeRef.current.gain.setValueAtTime(
      gainNodeRef.current.gain.value,
      now
    );

    modulatorIntervalRef.current = setInterval(() => {
      if (!gainNodeRef.current || !audioCtxRef.current) return;

      const noise = perlinNoise(t);
      const mapped = (noise + 1) / 2;
      const newGain = minGain + mapped * (maxGain - minGain);

      gainNodeRef.current.gain.setTargetAtTime(
        newGain,
        audioCtxRef.current.currentTime,
        timeConstant
      );

      // Soft Perlin wander on low-pass (roadmap: Perlin into filter)
      if (filterRef.current) {
        const filterNoise = perlinNoise(t * 0.7 + 40);
        const filterMapped = (filterNoise + 1) / 2;
        const filterHz = baseFilter * (0.72 + filterMapped * 0.56);
        filterRef.current.frequency.setTargetAtTime(
          filterHz,
          audioCtxRef.current.currentTime,
          0.12
        );
      }

      t += speed;
    }, 40);
  }

  // STOP PERLIN --------------------------------------
  function stopPerlinModulation() {
    if (modulatorIntervalRef.current) {
      clearInterval(modulatorIntervalRef.current);
      modulatorIntervalRef.current = null;
    }
  }

  // FILTER (low-pass) ----------------------------------------
  const handleFilterValue = e => {
    const value = parseFloat(e?.currentTarget?.value ?? e);
    setFilterValue(value);
    registerPlayerSituation(title, { filter: value });
    triggerIndicator(
      `${Math.round(highpassValue)} – ${Math.round(value)} Hz`
    );

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

  // HIGH-PASS ----------------------------------------
  const handleHighpassValue = e => {
    const value = parseFloat(e?.currentTarget?.value ?? e);
    setHighpassValue(value);
    registerPlayerSituation(title, { highpass: value });
    triggerIndicator(`${Math.round(value)} – ${Math.round(filterValue)} Hz`);

    if (loadASnap) {
      setLoadASnap(false);
    }
    if (highpassRef.current && audioCtxRef.current) {
      highpassRef.current.frequency.setTargetAtTime(
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
      } else if (isLayeredCreator && modulatorIntervalRef.setMasterGain) {
        modulatorIntervalRef.setMasterGain(value);
      } else {
        startPerlinModulation(isLayeredCreator ? 0 : 0.5, value);
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
    audioCtxRef.current = getSharedAudioContext();
    return audioCtxRef.current;
  };

  function clearPerlinFadeTimer() {
    if (perlinFadeTimerRef.current) {
      clearTimeout(perlinFadeTimerRef.current);
      perlinFadeTimerRef.current = null;
    }
  }

  function applyGainFadeIn(gainNode, targetValue, audioCtx, fadeSeconds = FADE_IN_DURATION) {
    const now = audioCtx.currentTime;
    gainNode.gain.cancelScheduledValues(now);
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(targetValue, now + fadeSeconds);
  }

  function schedulePerlinAfterFade(generation, maxGain, fadeSeconds = FADE_IN_DURATION) {
    clearPerlinFadeTimer();
    perlinFadeTimerRef.current = setTimeout(() => {
      perlinFadeTimerRef.current = null;
      if (isPlaybackCancelled(generation)) return;
      // Wider dynamic range for wind: near-quiet lulls → full gusts
      startPerlinModulation(
        isLayeredCreator ? WIND_MIN_GAIN : 0.5,
        maxGain
      );
    }, fadeSeconds * 1000);
  }

  function crossfadeParams(
    newVol,
    newFilter,
    newSpeed,
    newHighpass = highpassValue
  ) {
    const audioCtx = audioCtxRef.current;
    if (!audioCtx || !gainNodeRef.current || !filterRef.current) {
      play(null, sourcePath, custom, newVol, newFilter, newSpeed, newHighpass);
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

    if (highpassRef.current) {
      highpassRef.current.frequency.cancelScheduledValues(now);
      highpassRef.current.frequency.setValueAtTime(
        highpassRef.current.frequency.value,
        now
      );
      highpassRef.current.frequency.linearRampToValueAtTime(
        newHighpass,
        now + FADE_IN_DURATION
      );
    }

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
      highpass: newHighpass,
      speed: newSpeed,
      pan: panValueRef.current,
      width: widthValueRef.current,
      ...(isWindCreator
        ? { windParams: serializeWindParams(windParamsRef.current) }
        : {}),
      ...(isMusic ? { stretch: stretchEnabledRef.current } : {}),
    });

    if (custom === 'perlinNoise') {
      stopPerlinModulation();
      if (isLayeredCreator) {
        startPerlinModulation(WIND_MIN_GAIN, newVol);
      } else {
        schedulePerlinAfterFade(generation, newVol);
      }
    }
  }

  // PLAY ----------------------------------------
  async function play(
    event,
    sourcePath,
    custom,
    newVol = volValue,
    newFilter = filterValue,
    newSpeed = playbackRate,
    newHighpass = highpassValue,
    fadeInSeconds
  ) {
    cancelPendingFade();

    // Initialize and resume AudioContext on user gesture
    const audioCtx = initAudioContext();
    if (audioCtx.state === 'suspended') {
      await resumeSharedAudioContext();
    }

    if (isPlaying) {
      if (event) {
        registerPlayerSituation(title, { isPlaying: false });
        stop();
      }
      return;
    }
    const generation = ++playbackGenerationRef.current;
    setIsPlaying(true);
    setStopAll(false);
    registerPlayerSituation(title, {
      isPlaying: true,
      volume: newVol,
      filter: newFilter,
      highpass: newHighpass,
      speed: newSpeed,
      pan: panValueRef.current,
      width: widthValueRef.current,
      ...(isWindCreator
        ? { windParams: serializeWindParams(windParamsRef.current) }
        : {}),
      ...(isMusic ? { stretch: stretchEnabledRef.current } : {}),
    });

    await playFromSource(
      sourcePath,
      custom,
      newVol,
      newFilter,
      newSpeed,
      false,
      generation,
      newHighpass,
      fadeInSeconds
    );
  }

  async function playFromSource(
    source,
    custom,
    newVol = volValue,
    newFilter = filterValue,
    newSpeed = playbackRate,
    forceReload = false,
    generation = playbackGenerationRef.current,
    newHighpass = highpassValue,
    fadeInSeconds
  ) {
    const fadeIn =
      typeof fadeInSeconds === 'number' && fadeInSeconds > 0
        ? fadeInSeconds
        : FADE_IN_DURATION;
    cancelPendingFade();

    if (isPlaybackCancelled(generation)) return;
    const audioCtx = initAudioContext();
    if (audioCtx.state === 'suspended') await resumeSharedAudioContext();

    try {
      if (forceReload) {
        audioBufferRef.current = null;
      }

      let audioBuffer = audioBufferRef.current;

      // Si on n'a pas encore le buffer en cache, on le charge
      if (!audioBuffer) {
        setIsLoading(true);

        // 1. OBTENTION DE L'INSTANCE AUDIO (soit Bruit Blanc, soit API, soit Fichier)
        if (title === 'whiteNoise' || isWindCreator || (!source && !custom)) {
          if (isWindCreator) {
            audioBuffer = createWindNoiseBuffer(audioCtx);
          } else {
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
          }
        } else {
          let audioSource = source;
          if (source === 'apiSearch') {
            const playerConfig = config.find(x => x.title === title);
            const newPlaylist = [];

            if (hasFreesoundApiKey() && playerConfig?.apiSuggestions?.length) {
              const playlistOfIds = makePlaylist(playerConfig.apiSuggestions);
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
            }

            if (newPlaylist.length === 0) {
              LOCAL_MUSIC_TRACKS.forEach((track, index) => {
                newPlaylist.push({
                  ...track,
                  isCurrent: index === 0,
                });
              });
              setNotification({
                message: hasFreesoundApiKey()
                  ? 'API unavailable — playing local piano library'
                  : 'Playing local piano library (no Freesound API key)',
              });
              setTimeout(() => setNotification(null), 4000);
            }

            if (isPlaybackCancelled(generation)) {
              setIsLoading(false);
              return;
            }

            setPlaylist(newPlaylist);
            playlistRef.current = newPlaylist;
            const firstTrack = newPlaylist.find(p => p.isCurrent) || newPlaylist[0];
            audioSource = firstTrack.url;
            if (hasFreesoundApiKey() && !String(firstTrack.id).includes('local')) {
              setNotification({
                message: `Now playing "${firstTrack.title}" by ${firstTrack.author}`,
              });
              setTimeout(() => setNotification(null), 3000);
            }
          }

          if (!audioSource) {
            throw new Error('No audio source provided');
          }

          audioBuffer = await cacheManager.decodeFromUrl(audioSource, audioCtx, {
            persist: String(audioSource).startsWith('/assets/'),
          });

          if (
            stretchEnabledRef.current &&
            audioBuffer &&
            !isPlaybackCancelled(generation)
          ) {
            setNotification({ message: 'Stretching texture…' });
            audioBuffer = await stretchAudioBuffer(audioCtx, audioBuffer, {
              stretchFactor: 8,
              maxInputSeconds: 18,
            });
            setTimeout(() => setNotification(null), 2000);
          }
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
      if (highpassRef.current) highpassRef.current.disconnect();
      if (windLayerNodesRef.current) {
        disconnectWindLayerGraph(windLayerNodesRef.current);
        windLayerNodesRef.current = null;
      }
      if (gainNodeRef.current) gainNodeRef.current.disconnect();
      if (spatialChainRef.current) {
        spatialChainRef.current.disconnect();
        spatialChainRef.current = null;
      }
      if (reverbNodeRef.current) reverbNodeRef.current.disconnect();
      if (reverbGainNodeRef.current) reverbGainNodeRef.current.disconnect();

      // 4. CRÉATION DU GRAPHE AUDIO
      if (isWindCreator) {
        const { sourceNode, masterGain, layerNodes } = buildWindLayerGraph(
          audioCtx,
          audioBuffer,
          windParamsRef.current.layers
        );

        const spatial = buildPanOnlyChain(
          audioCtx,
          masterGain,
          panValueRef.current
        );
        spatialChainRef.current = spatial;

        if (isPlaybackCancelled(generation)) {
          setIsLoading(false);
          return;
        }

        sourceNode.start();
        sourceNodeRef.current = sourceNode;
        gainNodeRef.current = masterGain;
        filterRef.current = null;
        highpassRef.current = null;
        windLayerNodesRef.current = layerNodes;

        startPerlinModulation(WIND_MIN_GAIN, newVol, fadeInSeconds);
        setIsLoading(false);
        return;
      }

      const sourceNode = audioCtx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      // Music is a playlist — never loop a single track
      sourceNode.loop =
        !isMusic && source !== 'apiSearch' && title !== 'bowl';
      sourceNode.playbackRate.setValueAtTime(newSpeed, audioCtx.currentTime);

      const gainNode = audioCtx.createGain();
      const dryLevel = source === 'apiSearch' || isMusic ? 1 - reverbValue : 1;
      const dryTarget = newVol * dryLevel;
      applyGainFadeIn(gainNode, dryTarget, audioCtx, fadeIn);

      const highpass = audioCtx.createBiquadFilter();
      highpass.type = 'highpass';
      highpass.frequency.setValueAtTime(newHighpass, audioCtx.currentTime);
      highpass.Q.setValueAtTime(0.7, audioCtx.currentTime);

      const filter = audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(newFilter, audioCtx.currentTime);

      sourceNode.connect(highpass);
      highpass.connect(filter);
      filter.connect(gainNode);

      const spatial = buildSpatialChain(audioCtx, gainNode, {
        pan: panValueRef.current,
        width: widthValueRef.current,
      });
      spatialChainRef.current = spatial;

      // Reverb path pour music / API
      if (source === 'apiSearch' || isMusic) {
        const reverbNode = audioCtx.createConvolver();
        reverbNode.buffer = createImpulseResponse(audioCtx, reverbDuration);
        const reverbGainNode = audioCtx.createGain();
        const wetTarget = newVol * reverbValue;
        applyGainFadeIn(reverbGainNode, wetTarget, audioCtx, fadeIn);

        filter.connect(reverbNode);
        reverbNode.connect(reverbGainNode);
        connectToMasterBus(reverbGainNode);

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
      highpassRef.current = highpass;
      filterRef.current = filter;

      if (isMusic) {
        scheduleMusicCrossfade(
          audioBuffer.duration,
          newSpeed,
          generation
        );
        preloadNextMusicBuffer(generation);
      }

      if (custom === 'perlinNoise') {
        schedulePerlinAfterFade(generation, newVol, fadeIn);
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
    if (highpassRef.current) {
      highpassRef.current.disconnect();
      highpassRef.current = null;
    }
    if (windLayerNodesRef.current) {
      disconnectWindLayerGraph(windLayerNodesRef.current);
      windLayerNodesRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
    if (spatialChainRef.current) {
      spatialChainRef.current.disconnect();
      spatialChainRef.current = null;
    }
    if (stereoNodesRef.current) {
      try {
        stereoNodesRef.current.merger?.disconnect();
        stereoNodesRef.current.splitter?.disconnect();
        stereoNodesRef.current.delayRight?.disconnect();
      } catch {
        // already disconnected
      }
      stereoNodesRef.current = null;
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

  function stop({ fade = true, fadeSeconds: fadeOverride } = {}) {
    invalidatePlayback();
    clearMusicAdvanceTimer();
    nextMusicBufferRef.current = null;
    nextMusicUrlRef.current = null;
    musicCrossfadingRef.current = false;

    if (fadeTimeoutRef.current) {
      clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
    clearPerlinFadeTimer();
    isFadingRef.current = false;

    setIsLoading(false);
    setIsPlaying(false);

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

    const fadeSeconds =
      typeof fadeOverride === 'number' && fadeOverride > 0
        ? fadeOverride
        : stopFadeDuration != null && stopFadeDuration > 0
          ? stopFadeDuration
          : FADE_OUT_DURATION;

    const shouldFade =
      fade && audioCtxRef.current && gainNodeRef.current && fadeSeconds > 0;

    if (!shouldFade) {
      disconnectAudioNodes();
      if (stopFadeDuration != null) setStopFadeDuration(null);
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
      gainNodeRef.current.gain.linearRampToValueAtTime(0, now + fadeSeconds);
    }

    if (reverbGainNodeRef.current) {
      reverbGainNodeRef.current.gain.cancelScheduledValues(now);
      reverbGainNodeRef.current.gain.setValueAtTime(
        reverbGainNodeRef.current.gain.value,
        now
      );
      reverbGainNodeRef.current.gain.linearRampToValueAtTime(
        0,
        now + fadeSeconds
      );
    }

    fadeTimeoutRef.current = setTimeout(() => {
      isFadingRef.current = false;
      fadeTimeoutRef.current = null;
      disconnectAudioNodes();
      if (stopFadeDuration != null) setStopFadeDuration(null);
    }, fadeSeconds * 1000);
  }

  // SPATIAL ------------------------------------------------
  function handlePanValue(event) {
    const value = Number(event.target.value);
    setPanValue(value);
    panValueRef.current = value;
    registerPlayerSituation(title, { pan: value });
    spatialChainRef.current?.setPan?.(value);
    triggerIndicator(`Pan ${value > 0 ? '+' : ''}${value.toFixed(2)}`);
  }

  function handleWidthValue(event) {
    const value = Number(event.target.value);
    setWidthValue(value);
    widthValueRef.current = value;
    registerPlayerSituation(title, { width: value });
    spatialChainRef.current?.setWidth?.(value);
    triggerIndicator(`Width ${Math.round(value * 100)}%`);
  }

  function clearMusicAdvanceTimer() {
    if (musicAdvanceTimerRef.current) {
      clearTimeout(musicAdvanceTimerRef.current);
      musicAdvanceTimerRef.current = null;
    }
  }

  async function prepareMusicBuffer(url, audioCtx, generation) {
    let buffer = await cacheManager.decodeFromUrl(url, audioCtx, {
      persist: String(url).startsWith('/assets/'),
    });
    if (
      stretchEnabledRef.current &&
      buffer &&
      !isPlaybackCancelled(generation)
    ) {
      buffer = await stretchAudioBuffer(audioCtx, buffer, {
        stretchFactor: 8,
        maxInputSeconds: 18,
      });
    }
    return buffer;
  }

  function scheduleMusicCrossfade(bufferDuration, speed, generation) {
    clearMusicAdvanceTimer();
    if (!isMusic || !bufferDuration) return;

    const rate = speed > 0 ? speed : 1;
    const durationSec = bufferDuration / rate;
    const lead = Math.min(MUSIC_CROSSFADE, Math.max(0.8, durationSec * 0.15));
    const waitMs = Math.max(50, (durationSec - lead) * 1000);

    musicAdvanceTimerRef.current = setTimeout(() => {
      musicAdvanceTimerRef.current = null;
      if (isPlaybackCancelled(generation) || !isPlayingRef.current) return;
      refresh();
    }, waitMs);
  }

  async function preloadNextMusicBuffer(generation) {
    if (!isMusic) return;
    const list = playlistRef.current;
    if (!Array.isArray(list) || list.length < 2) return;

    const currentIndex = list.findIndex(track => track.isCurrent);
    if (currentIndex < 0) return;

    const nextTrack = list[(currentIndex + 1) % list.length];
    if (!nextTrack?.url) return;
    if (
      nextMusicUrlRef.current === nextTrack.url &&
      nextMusicBufferRef.current
    ) {
      return;
    }

    nextMusicUrlRef.current = nextTrack.url;
    nextMusicBufferRef.current = null;

    try {
      const audioCtx = audioCtxRef.current;
      if (!audioCtx) return;
      const buffer = await prepareMusicBuffer(
        nextTrack.url,
        audioCtx,
        generation
      );
      if (isPlaybackCancelled(generation)) return;
      if (nextMusicUrlRef.current === nextTrack.url) {
        nextMusicBufferRef.current = buffer;
      }
    } catch (err) {
      console.warn('[music] preload failed:', err);
    }
  }

  function disconnectOutgoingMusicNodes(nodes) {
    if (!nodes) return;
    const { source, gain, highpass, filter, reverb, reverbGain, spatial } =
      nodes;
    if (source) {
      source.onended = null;
      try {
        source.stop();
      } catch {
        /* already stopped */
      }
      try {
        source.disconnect();
      } catch {
        /* already disconnected */
      }
    }
    try {
      highpass?.disconnect();
      filter?.disconnect();
      gain?.disconnect();
      reverb?.disconnect();
      reverbGain?.disconnect();
      spatial?.disconnect?.();
    } catch {
      /* already disconnected */
    }
  }

  // REFRESH -----------------------------------------------
  const refresh = async () => {
    if (!isPlayingRef.current || !isMusic) return;
    if (musicCrossfadingRef.current) return;

    const generation = playbackGenerationRef.current;
    if (isPlaybackCancelled(generation)) return;

    const currentPlaylist = playlistRef.current;
    const currentIndex = currentPlaylist.findIndex(x => x.isCurrent);
    if (currentIndex === -1 || currentPlaylist.length === 0) return;

    musicCrossfadingRef.current = true;
    clearMusicAdvanceTimer();

    if (audioCtxRef.current?.state === 'suspended') {
      await resumeSharedAudioContext();
    }

    const nextIndex = (currentIndex + 1) % currentPlaylist.length;
    const updatedPlaylist = currentPlaylist.map((track, index) => ({
      ...track,
      isCurrent: index === nextIndex,
    }));
    setPlaylist(updatedPlaylist);
    playlistRef.current = updatedPlaylist;

    const nextTrack = updatedPlaylist[nextIndex];
    setCustomSound(nextTrack);
    setNotification({
      message: `Now playing "${nextTrack.title}" by ${nextTrack.author}`,
    });
    setTimeout(() => setNotification(null), 3000);

    const audioCtx = audioCtxRef.current;
    if (!audioCtx) {
      musicCrossfadingRef.current = false;
      return;
    }

    let nextBuffer = null;
    const hadPreload =
      nextMusicUrlRef.current === nextTrack.url && nextMusicBufferRef.current;

    if (hadPreload) {
      nextBuffer = nextMusicBufferRef.current;
      nextMusicBufferRef.current = null;
      nextMusicUrlRef.current = null;
    } else {
      setIsLoading(true);
      try {
        nextBuffer = await prepareMusicBuffer(
          nextTrack.url,
          audioCtx,
          generation
        );
      } catch (err) {
        console.error('[music] crossfade load failed:', err);
        setNotification({ message: 'Could not load next track' });
        setTimeout(() => setNotification(null), 3000);
        setIsLoading(false);
        musicCrossfadingRef.current = false;
        return;
      }
      setIsLoading(false);
    }

    if (isPlaybackCancelled(generation) || !nextBuffer || !isPlayingRef.current) {
      musicCrossfadingRef.current = false;
      return;
    }

    // Hold outgoing graph while incoming fades in
    const outgoing = {
      source: sourceNodeRef.current,
      gain: gainNodeRef.current,
      highpass: highpassRef.current,
      filter: filterRef.current,
      reverb: reverbNodeRef.current,
      reverbGain: reverbGainNodeRef.current,
      spatial: spatialChainRef.current,
    };
    if (outgoing.source) outgoing.source.onended = null;
    spatialChainRef.current = null;

    const newVol = volValueRef.current;
    const newFilter = filterValueRef.current;
    const newHighpass = highpassValueRef.current;
    const newSpeed = playbackRateRef.current;
    const wet = reverbValueRef.current;
    const room = reverbDurationRef.current;

    const sourceNode = audioCtx.createBufferSource();
    sourceNode.buffer = nextBuffer;
    sourceNode.loop = false;
    sourceNode.playbackRate.setValueAtTime(newSpeed, audioCtx.currentTime);

    const gainNode = audioCtx.createGain();
    const highpass = audioCtx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(newHighpass, audioCtx.currentTime);
    highpass.Q.setValueAtTime(0.7, audioCtx.currentTime);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(newFilter, audioCtx.currentTime);

    sourceNode.connect(highpass);
    highpass.connect(filter);
    filter.connect(gainNode);
    spatialChainRef.current = buildSpatialChain(audioCtx, gainNode, {
      pan: panValueRef.current,
      width: widthValueRef.current,
    });

    const reverbNode = audioCtx.createConvolver();
    reverbNode.buffer = createImpulseResponse(audioCtx, room);
    const reverbGainNode = audioCtx.createGain();
    filter.connect(reverbNode);
    reverbNode.connect(reverbGainNode);
    connectToMasterBus(reverbGainNode);

    const now = audioCtx.currentTime;
    const xfade = MUSIC_CROSSFADE;
    const dryTarget = newVol * (1 - wet);
    const wetTarget = newVol * wet;

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(dryTarget, now + xfade);
    reverbGainNode.gain.setValueAtTime(0, now);
    reverbGainNode.gain.linearRampToValueAtTime(wetTarget, now + xfade);

    if (outgoing.gain) {
      outgoing.gain.gain.cancelScheduledValues(now);
      outgoing.gain.gain.setValueAtTime(outgoing.gain.gain.value, now);
      outgoing.gain.gain.linearRampToValueAtTime(0, now + xfade);
    }
    if (outgoing.reverbGain) {
      outgoing.reverbGain.gain.cancelScheduledValues(now);
      outgoing.reverbGain.gain.setValueAtTime(
        outgoing.reverbGain.gain.value,
        now
      );
      outgoing.reverbGain.gain.linearRampToValueAtTime(0, now + xfade);
    }

    sourceNode.start();
    sourceNodeRef.current = sourceNode;
    gainNodeRef.current = gainNode;
    highpassRef.current = highpass;
    filterRef.current = filter;
    reverbNodeRef.current = reverbNode;
    reverbGainNodeRef.current = reverbGainNode;
    audioBufferRef.current = null;

    setTimeout(() => {
      disconnectOutgoingMusicNodes(outgoing);
    }, xfade * 1000 + 40);

    scheduleMusicCrossfade(nextBuffer.duration, newSpeed, generation);
    preloadNextMusicBuffer(generation);
    musicCrossfadingRef.current = false;
  };

  const renderActiveCard = () => (
    <div
      className={`active-player-card${isLayeredCreator ? ' active-player-card--wind' : ''}`}
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
            {!isLayeredCreator && (
              <div
                className="active-player-card__row"
                role="group"
                aria-label="Band filter"
              >
                <span className="active-player-card__row-label">
                  <i className="fa-solid fa-filter" aria-hidden="true" />
                </span>
                <BandFilterSlider
                  low={highpassValue}
                  high={filterValue}
                  onLowChange={handleHighpassValue}
                  onHighChange={handleFilterValue}
                />
              </div>
            )}
            {title !== 'bowl' && (
              <>
                <label className="active-player-card__row">
                  <span className="active-player-card__row-label">
                    <i className="fa-solid fa-left-right" aria-hidden="true" />
                  </span>
                  <input
                    className="active-player-card__range"
                    type="range"
                    min="-1"
                    max="1"
                    step="0.01"
                    value={panValue}
                    onChange={handlePanValue}
                    aria-label="Pan"
                  />
                </label>
                {!isLayeredCreator && (
                  <label className="active-player-card__row">
                    <span className="active-player-card__row-label">
                      <i
                        className="fa-solid fa-expand"
                        aria-hidden="true"
                      />
                    </span>
                    <input
                      className="active-player-card__range"
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={widthValue}
                      onChange={handleWidthValue}
                      aria-label="Stereo width"
                    />
                  </label>
                )}
              </>
            )}
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
            {!isLayeredCreator && (
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
            )}
            {speed && !isLayeredCreator && (
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
            {isWindCreator && (
              <WindCreatorSliders
                params={windParams}
                onChange={(next, key) => {
                  const merged = mergeWindParams(next);
                  setWindParams(merged);
                  registerPlayerSituation(title, {
                    windParams: serializeWindParams(merged),
                  });
                  handleLayeredCreatorChange(next, key, WIND_LAYER_SLIDERS, WIND_GLOBAL_SLIDERS);
                }}
              />
            )}
            {isMusic && (
              <button
                type="button"
                className={`player-control-btn active-player-card__stretch${
                  stretchEnabled ? ' player-control-btn--active' : ''
                }`}
                onClick={async () => {
                  const next = !stretchEnabled;
                  setStretchEnabled(next);
                  stretchEnabledRef.current = next;
                  registerPlayerSituation(title, { stretch: next });
                  triggerIndicator(next ? 'Stretch on' : 'Stretch off');
                  // Invalidate preloaded (stretch) buffers
                  nextMusicBufferRef.current = null;
                  nextMusicUrlRef.current = null;
                  if (!isPlaying) return;
                  // Crossfade into a freshly processed version of the current track
                  const list = playlistRef.current;
                  const current = list.find(t => t.isCurrent) || list[0];
                  if (!current?.url) return;
                  const generation = playbackGenerationRef.current;
                  musicCrossfadingRef.current = false;
                  clearMusicAdvanceTimer();
                  setIsLoading(true);
                  try {
                    const audioCtx = audioCtxRef.current;
                    const buffer = await prepareMusicBuffer(
                      current.url,
                      audioCtx,
                      generation
                    );
                    if (isPlaybackCancelled(generation) || !buffer) {
                      setIsLoading(false);
                      return;
                    }
                    // Temporarily point "next" at same track and reuse crossfade path
                    // by swapping playlist current with itself via manual fade
                    const outgoing = {
                      source: sourceNodeRef.current,
                      gain: gainNodeRef.current,
                      highpass: highpassRef.current,
                      filter: filterRef.current,
                      reverb: reverbNodeRef.current,
                      reverbGain: reverbGainNodeRef.current,
                      spatial: spatialChainRef.current,
                    };
                    if (outgoing.source) outgoing.source.onended = null;
                    spatialChainRef.current = null;

                    const newVol = volValueRef.current;
                    const wet = reverbValueRef.current;
                    const sourceNode = audioCtx.createBufferSource();
                    sourceNode.buffer = buffer;
                    sourceNode.loop = false;
                    sourceNode.playbackRate.setValueAtTime(
                      playbackRateRef.current,
                      audioCtx.currentTime
                    );

                    const gainNode = audioCtx.createGain();
                    const highpass = audioCtx.createBiquadFilter();
                    highpass.type = 'highpass';
                    highpass.frequency.setValueAtTime(
                      highpassValueRef.current,
                      audioCtx.currentTime
                    );
                    highpass.Q.setValueAtTime(0.7, audioCtx.currentTime);
                    const filter = audioCtx.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(
                      filterValueRef.current,
                      audioCtx.currentTime
                    );

                    sourceNode.connect(highpass);
                    highpass.connect(filter);
                    filter.connect(gainNode);
                    spatialChainRef.current = buildSpatialChain(
                      audioCtx,
                      gainNode,
                      {
                        pan: panValueRef.current,
                        width: widthValueRef.current,
                      }
                    );

                    const reverbNode = audioCtx.createConvolver();
                    reverbNode.buffer = createImpulseResponse(
                      audioCtx,
                      reverbDurationRef.current
                    );
                    const reverbGainNode = audioCtx.createGain();
                    filter.connect(reverbNode);
                    reverbNode.connect(reverbGainNode);
                    connectToMasterBus(reverbGainNode);

                    const now = audioCtx.currentTime;
                    const xfade = MUSIC_CROSSFADE;
                    gainNode.gain.setValueAtTime(0, now);
                    gainNode.gain.linearRampToValueAtTime(
                      newVol * (1 - wet),
                      now + xfade
                    );
                    reverbGainNode.gain.setValueAtTime(0, now);
                    reverbGainNode.gain.linearRampToValueAtTime(
                      newVol * wet,
                      now + xfade
                    );
                    if (outgoing.gain) {
                      outgoing.gain.gain.cancelScheduledValues(now);
                      outgoing.gain.gain.setValueAtTime(
                        outgoing.gain.gain.value,
                        now
                      );
                      outgoing.gain.gain.linearRampToValueAtTime(0, now + xfade);
                    }
                    if (outgoing.reverbGain) {
                      outgoing.reverbGain.gain.cancelScheduledValues(now);
                      outgoing.reverbGain.gain.setValueAtTime(
                        outgoing.reverbGain.gain.value,
                        now
                      );
                      outgoing.reverbGain.gain.linearRampToValueAtTime(
                        0,
                        now + xfade
                      );
                    }

                    sourceNode.start();
                    sourceNodeRef.current = sourceNode;
                    gainNodeRef.current = gainNode;
                    highpassRef.current = highpass;
                    filterRef.current = filter;
                    reverbNodeRef.current = reverbNode;
                    reverbGainNodeRef.current = reverbGainNode;

                    setTimeout(
                      () => disconnectOutgoingMusicNodes(outgoing),
                      xfade * 1000 + 40
                    );
                    scheduleMusicCrossfade(
                      buffer.duration,
                      playbackRateRef.current,
                      generation
                    );
                    preloadNextMusicBuffer(generation);
                  } catch (err) {
                    console.error(err);
                  }
                  setIsLoading(false);
                }}
                aria-pressed={stretchEnabled}
                aria-label="Toggle Paulstretch texture"
              >
                <i className="fa-solid fa-wave-square" aria-hidden="true" />
                <span className="active-player-card__stretch-label">
                  Stretch
                </span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );

  function handleLayeredCreatorChange(next, key, layerSliders, globalSliders) {
    if (!key) return;

    if (key === 'addLayer') {
      triggerIndicator(`Track ${next.layers.length} added`);
      return;
    }
    if (key === 'removeLayer') {
      triggerIndicator(`Track removed`);
      return;
    }

    if (key.includes('.')) {
      const [layerId, paramKey] = key.split('.');
      const index = next.layers.findIndex(l => l.id === layerId);
      const layer = next.layers[index];
      const label = `Track ${index + 1}`;
      const slider = layerSliders.find(s => s.key === paramKey);
      if (paramKey === 'enabled' && layer) {
        triggerIndicator(`${label}: ${layer.enabled ? 'on' : 'off'}`);
      } else if (
        (paramKey === 'highpass' || paramKey === 'lowpass') &&
        layer &&
        layer.highpass != null
      ) {
        triggerIndicator(
          `${label}: ${Math.round(layer.highpass)}–${Math.round(layer.lowpass)} Hz`
        );
      } else if (slider && layer) {
        triggerIndicator(`${label} ${slider.label}: ${layer[paramKey]}`);
      }
      return;
    }

    const globalMeta = globalSliders.find(s => s.key === key);
    if (globalMeta) {
      triggerIndicator(`${globalMeta.label}: ${next[key]}`);
    }
  }

  return (
    <>
      <div
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
