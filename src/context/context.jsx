import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import localforage from 'localforage';
import { CROSSFADE_DURATION } from '../ref/mix.constants';
import {
  THEME_IDS,
  THEME_STORAGE_KEY,
  getStoredTheme,
  getThemeById,
} from '../ref/themes';

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
  const [cachedAudios, setCachedAudios] = useState(null);
  const [playlist, setPlaylist] = useState([]);
  const [zenQuote, setZenQuote] = useState(null);

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

  //Cache ------------------------
  useEffect(() => {
    // On ne pré-charge plus rien au démarrage pour économiser les ressources sur mobile.
    // Le chargement se fera à la demande dans le composant Player.
    setCachedAudios({});
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

  const loadMix = useCallback(({ label, snapMap, activeMix: mixMeta }) => {
    if (mixTransitionTimeoutRef.current) {
      clearTimeout(mixTransitionTimeoutRef.current);
    }

    setMixTransition(true);
    setRandomSnap(snapMap ?? null);
    setPlayingSnap(label);
    setLoadASnap(true);
    setStopAll(false);
    setActiveMix(mixMeta ?? null);

    mixTransitionTimeoutRef.current = setTimeout(() => {
      setMixTransition(false);
      setLoadASnap(false);
      mixTransitionTimeoutRef.current = null;
    }, CROSSFADE_DURATION * 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (mixTransitionTimeoutRef.current) {
        clearTimeout(mixTransitionTimeoutRef.current);
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
      randomSnap,
      setRandomSnap,
      mixTransition,
      activeMix,
      setActiveMix,
      loadMix,
      clearActiveMix,
      cachedAudios,
      setCachedAudios,
      playlist,
      setPlaylist,
      zenQuote,
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
      randomSnap,
      mixTransition,
      activeMix,
      cachedAudios,
      playlist,
      zenQuote,
      loadMix,
      clearActiveMix,
      setTheme,
    ]
  );

  return <Context.Provider value={providerValue}>{children}</Context.Provider>;
}
