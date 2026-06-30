import { createContext, useEffect, useMemo, useState } from 'react';
import localforage from 'localforage';

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
  const [theme, setTheme] = useState('light');
  const [customSound, setCustomSound] = useState(null);
  const [currentInput, setCurrentInput] = useState(null);
  const [snapshotMix, setSnapshotMix] = useState(new Map());
  const [notification, setNotification] = useState(null);
  const [savedSnaps, setSavedSnaps] = useState(new Map());
  const [loadASnap, setLoadASnap] = useState(false);
  const [playingSnap, setPlayingSnap] = useState(null);
  const [stopAll, setStopAll] = useState(false);
  const [randomSnap, setRandomSnap] = useState(null);
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
      cachedAudios,
      playlist,
      zenQuote,
    ]
  );

  return <Context.Provider value={providerValue}>{children}</Context.Provider>;
}
