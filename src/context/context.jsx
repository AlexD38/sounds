import { createContext, useEffect, useMemo, useState } from 'react';
import localforage from 'localforage';
import { cacheManager } from '../utils/cacheManager';
import { config } from '../ref/random.config';

// Crée le contexte
export const Context = createContext();

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
  const [isReady, setIsReady] = useState([]);
  const [playlist, setPlaylist] = useState([]);
  const [zenQuote, setZenQuote] = useState(null);

  // QUOTE ---------------------------------------------------------
  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const response = await fetch(
          'https://quoteslate.vercel.app/api/quotes/random'
        );
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
    const processSound = async ({ title }) => {
      try {
        const audioBuffer = await cacheManager.decodeSound({ title });
        if (audioBuffer) {
          setCachedAudios(prev => ({ ...prev, [title]: audioBuffer }));
          setIsReady(prev => [...prev, title]);
        }
      } catch (error) {
        console.error(`Failed to process sound: ${title}`, error);
      }
    };

    const fetchData = async () => {
      for (const { title } of config) {
        if (title == 'whiteNoise' || title == 'music') continue;
        processSound({ title });
      }
    };

    fetchData();
  }, []);

  // Load snaps from localforage on initial mount
  useEffect(() => {
    const getSavedSnaps = async () => {
      const previouslySavedSnaps = await localforage.getItem('savedSnapshots');
      if (previouslySavedSnaps) {
        setSavedSnaps(previouslySavedSnaps);
      }
    };

    getSavedSnaps();
  }, []); // Empty dependency array ensures this runs only once

  // Function to update state and persist to localforage
  const updateAndPersistSavedSnaps = async newSnaps => {
    setSavedSnaps(newSnaps);
    await localforage.setItem('savedSnapshots', newSnaps);
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

  const saveSnapshot = async () => {
    // On transforme le Map en données sérialisables uniquement
    const serializableMap = new Map();

    if (snapshotMix.size === 0) {
      setNotification({
        message: 'There is nothing to save',
      });
      setTimeout(() => {
        setNotification(null);
      }, 3000);
      return;
    } else {
      let IsSavable = false;
      for (const [key, value] of snapshotMix) {
        if (value.isPlaying) {
          IsSavable = true;
        }
      }
      if (!IsSavable) {
        setNotification({
          message: 'You cannot save a snapshot if no player is On',
        });
        setTimeout(() => {
          setNotification(null);
        }, 3000);
        return;
      }
    }

    snapshotMix.forEach((key, value) => {
      // On extrait seulement les propriétés utilisables
      serializableMap.set(key, value);
    });

    // await localforage.setItem('snapshot', serializableMap);
    setNotification({ message: 'Successfully saved snapshot' });

    setTimeout(() => {
      setNotification(null);
    }, 3000);
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
      saveSnapshot,
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
      isReady,
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
    ]
  );

  return <Context.Provider value={providerValue}>{children}</Context.Provider>;
}
