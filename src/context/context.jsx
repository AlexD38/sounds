import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import localforage from 'localforage';
import { CROSSFADE_DURATION } from '../ref/mix.constants';
import { config } from '../ref/random.config';
import {
  THEME_IDS,
  THEME_STORAGE_KEY,
  getStoredTheme,
  getThemeById,
} from '../ref/themes';
import { cacheManager } from '../utils/cacheManager';
import {
  clearShareParamFromUrl,
  readSharedMixFromLocation,
} from '../utils/mixShare';
import {
  evolveMix,
  formatEvolveInterval,
  nextEvolveDelayMs,
} from '../utils/evolveMix';

// Crée le contexte
// eslint-disable-next-line react-refresh/only-export-components
export const Context = createContext();

const toSavedSnapsMap = data => {
  if (data instanceof Map) return data;
  if (Array.isArray(data)) return new Map(data);
  return new Map();
};

// Crée le provider
export function ContextProvider({ children }) {
  const [theme, setThemeState] = useState(getStoredTheme);
  const [customSound, setCustomSound] = useState(null);
  const [currentInput, setCurrentInput] = useState(null);
  const [snapshotMix, setSnapshotMix] = useState(new Map());
  const [notification, setNotification] = useState(null);
  const [savedSnaps, setSavedSnaps] = useState(new Map());
  const [loadASnap, setLoadASnap] = useState(false);
  const [playingSnap, setPlayingSnap] = useState(null);
  const [stopAll, setStopAll] = useState(false);
  const [randomSnap, setRandomSnap] = useState(null);
  const [mixTransition, setMixTransition] = useState(false);
  const [activeMix, setActiveMix] = useState(null);
  const [scenesSheetOpen, setScenesSheetOpen] = useState(false);
  const [scenesSheetTab, setScenesSheetTab] = useState('moods');
  const [cachedAudios, setCachedAudios] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [zenQuote, setZenQuote] = useState(null);
  /** Override fade-out duration (seconds) for the next stop-all, e.g. sleep timer. */
  const [stopFadeDuration, setStopFadeDuration] = useState(null);
  /** Fade length (seconds) for the mix currently being loaded. */
  const [mixFadeDuration, setMixFadeDuration] = useState(null);
  const [evolveEnabled, setEvolveEnabledState] = useState(false);

  const snapshotMixRef = useRef(snapshotMix);
  useEffect(() => {
    snapshotMixRef.current = snapshotMix;
  }, [snapshotMix]);

  const evolveEnabledRef = useRef(evolveEnabled);
  useEffect(() => {
    evolveEnabledRef.current = evolveEnabled;
  }, [evolveEnabled]);

  const evolveTimerRef = useRef(null);

  // QUOTE ---------------------------------------------------------
  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch(
          'https://quoteslate.vercel.app/api/quotes/random'
        );
        if (!response.ok) return;
        const data = await response.json();
        setZenQuote(data);
      } catch (error) {
        console.error('Erreur de chargement de la citation :', error);
      }
    };

    fetchQuote();
  }, []);

  // Warm IndexedDB cache for local library (best-effort, after idle)
  useEffect(() => {
    setCachedAudios({});
    const titles = config
      .map(p => p.title)
      .filter(t => t !== 'whiteNoise' && t !== 'music' && t !== 'windCreator');
    titles.push('chopin', 'piano');

    const run = () => {
      cacheManager.warmLibrary(titles).catch(() => {});
    };

    if (typeof requestIdleCallback === 'function') {
      const id = requestIdleCallback(run, { timeout: 8000 });
      return () => cancelIdleCallback(id);
    }
    const timer = setTimeout(run, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Load snaps from localforage on initial mount
  useEffect(() => {
    const getSavedSnaps = async () => {
      const previouslySavedSnaps = await localforage.getItem('savedSnapshots');
      if (previouslySavedSnaps) {
        setSavedSnaps(toSavedSnapsMap(previouslySavedSnaps));
      }
    };

    getSavedSnaps();
  }, []);

  // Function to update state and persist to localforage
  const updateAndPersistSavedSnaps = async newSnaps => {
    setSavedSnaps(newSnaps);
    await localforage.setItem(
      'savedSnapshots',
      Array.from(newSnaps.entries())
    );
  };

  const registerPlayerSituation = (title, obj) => {
    setSnapshotMix(prevSnapshotMix => {
      const newSnapshotMix = new Map(prevSnapshotMix);
      const currentPlayerData = newSnapshotMix.get(title) || {};
      const updatedPlayerData = { ...currentPlayerData, ...obj };
      newSnapshotMix.set(title, updatedPlayerData);
      return newSnapshotMix;
    });
  };

  const mixTransitionTimeoutRef = useRef(null);

  const applyTheme = useCallback(themeId => {
    document.documentElement.setAttribute('data-theme', themeId);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', getThemeById(themeId).metaColor);
    }
  }, []);

  const setTheme = useCallback(
    themeId => {
      if (!THEME_IDS.includes(themeId)) return;

      setThemeState(themeId);
      applyTheme(themeId);

      try {
        localStorage.setItem(THEME_STORAGE_KEY, themeId);
      } catch {
        // localStorage may be unavailable
      }
    },
    [applyTheme]
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const clearActiveMix = useCallback(() => {
    setActiveMix(null);
  }, []);

  const openScenesSheet = useCallback((tab = 'moods') => {
    setScenesSheetTab(tab === 'mixes' ? 'mixes' : 'moods');
    setScenesSheetOpen(true);
  }, []);

  const loadMix = useCallback(({ label, snapMap, activeMix: mixMeta, fadeDuration }) => {
    if (mixTransitionTimeoutRef.current) {
      clearTimeout(mixTransitionTimeoutRef.current);
    }

    const hasCustomFade =
      typeof fadeDuration === 'number' && fadeDuration > 0;
    const fadeSec = hasCustomFade ? fadeDuration : CROSSFADE_DURATION;

    setMixFadeDuration(hasCustomFade ? fadeDuration : null);
    setMixTransition(true);
    setRandomSnap(snapMap ?? null);
    setPlayingSnap(label);
    setLoadASnap(true);
    setStopAll(false);
    setActiveMix(mixMeta ?? null);

    mixTransitionTimeoutRef.current = setTimeout(() => {
      setMixTransition(false);
      setLoadASnap(false);
      setMixFadeDuration(null);
      mixTransitionTimeoutRef.current = null;
    }, fadeSec * 1000);
  }, []);

  const clearEvolveTimer = useCallback(() => {
    if (evolveTimerRef.current) {
      clearTimeout(evolveTimerRef.current);
      evolveTimerRef.current = null;
    }
  }, []);

  const scheduleEvolveTick = useCallback(() => {
    clearEvolveTimer();
    if (!evolveEnabledRef.current) return;

    const delay = nextEvolveDelayMs();
    evolveTimerRef.current = setTimeout(() => {
      evolveTimerRef.current = null;
      if (!evolveEnabledRef.current) return;
      const snap = snapshotMixRef.current;
      const hasPlaying = Array.from(snap.values()).some(p => p?.isPlaying);
      if (!hasPlaying) {
        scheduleEvolveTick();
        return;
      }

      evolveMix({
        snapshotMix: snap,
        loadMix,
        setNotification,
        silent: true,
      });
      scheduleEvolveTick();
    }, delay);
  }, [clearEvolveTimer, loadMix]);

  const setEvolveEnabled = useCallback(
    enabled => {
      const next = Boolean(enabled);
      setEvolveEnabledState(next);
      evolveEnabledRef.current = next;
      if (!next) {
        clearEvolveTimer();
        setNotification({ message: 'The current mix will no longer evolve' });
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      const hasPlaying = Array.from(snapshotMixRef.current.values()).some(
        p => p?.isPlaying
      );
      if (!hasPlaying) {
        setEvolveEnabledState(false);
        evolveEnabledRef.current = false;
        setNotification({ message: 'Play something first to evolve it' });
        setTimeout(() => setNotification(null), 3000);
        return;
      }

      setNotification({
        message: `Evolve on · ${formatEvolveInterval()}`,
      });
      setTimeout(() => setNotification(null), 3000);
      scheduleEvolveTick();
    },
    [clearEvolveTimer, scheduleEvolveTick]
  );

  // Hydrate shared mix from ?mix= URL (after loadMix exists)
  useEffect(() => {
    try {
      const shared = readSharedMixFromLocation();
      if (!shared) return;

      const snapMap = new Map();
      snapMap.set(shared.title, shared);
      loadMix({
        label: shared.title,
        snapMap,
        activeMix: { type: 'shared', label: shared.title },
      });
      setNotification({ message: `Opened shared mix "${shared.title}"` });
      setTimeout(() => setNotification(null), 3500);
      clearShareParamFromUrl();
    } catch (err) {
      console.error('Failed to load shared mix:', err);
      setNotification({ message: 'Could not open shared mix link.' });
      setTimeout(() => setNotification(null), 4000);
      clearShareParamFromUrl();
    }
  }, [loadMix]);

  useEffect(() => {
    return () => {
      if (mixTransitionTimeoutRef.current) {
        clearTimeout(mixTransitionTimeoutRef.current);
      }
      if (evolveTimerRef.current) {
        clearTimeout(evolveTimerRef.current);
      }
    };
  }, []);

  const providerValue = useMemo(
    () => ({
      theme,
      setTheme,
      customSound,
      setCustomSound,
      currentInput,
      setCurrentInput,
      snapshotMix,
      registerPlayerSituation,
      notification,
      setNotification,
      setSavedSnaps: updateAndPersistSavedSnaps,
      savedSnaps,
      loadASnap,
      setLoadASnap,
      playingSnap,
      setPlayingSnap,
      stopAll,
      setStopAll,
      stopFadeDuration,
      setStopFadeDuration,
      mixFadeDuration,
      randomSnap,
      setRandomSnap,
      mixTransition,
      activeMix,
      setActiveMix,
      scenesSheetOpen,
      setScenesSheetOpen,
      scenesSheetTab,
      setScenesSheetTab,
      openScenesSheet,
      loadMix,
      clearActiveMix,
      cachedAudios,
      setCachedAudios,
      playlist,
      setPlaylist,
      zenQuote,
      evolveEnabled,
      setEvolveEnabled,
    }),
    [
      theme,
      customSound,
      currentInput,
      snapshotMix,
      notification,
      savedSnaps,
      loadASnap,
      playingSnap,
      stopAll,
      stopFadeDuration,
      mixFadeDuration,
      randomSnap,
      mixTransition,
      activeMix,
      scenesSheetOpen,
      scenesSheetTab,
      cachedAudios,
      playlist,
      zenQuote,
      loadMix,
      clearActiveMix,
      openScenesSheet,
      setTheme,
      evolveEnabled,
      setEvolveEnabled,
    ]
  );

  return <Context.Provider value={providerValue}>{children}</Context.Provider>;
}
