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
  const [cachedAudios, setCachedAudios] = useState({});

  // Cache des sons
  useEffect(() => {
    const fetchData = async () => {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      let cachedObj = {};

      for (const { title } of config) {
        if (title === 'whiteNoise' || title === 'music') continue;

        const cached = await localforage.getItem(title);
        if (cached) {
          try {
            const audioBuffer = await audioCtx.decodeAudioData(cached);
            cachedObj[title] = audioBuffer;
          } catch (error) {
            console.error(`Error decoding cached audio for ${title}:`, error);
            await localforage.removeItem(title);
          }
        }
      }

      const missingTitles = config
        .map(c => c.title)
        .filter(
          title =>
            title !== 'whiteNoise' && title !== 'music' && !cachedObj[title]
        );

      if (missingTitles.length > 0) {
        const decodedSounds = await cacheManager.decodeSounds(
          config.filter(c => missingTitles.includes(c.title)),
          audioCtx
        );
        decodedSounds.forEach(({ title, audioBuffer }) => {
          cachedObj[title] = audioBuffer;
        });
      }

      setCachedAudios(cachedObj);
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
    ]
  );

  return <Context.Provider value={providerValue}>{children}</Context.Provider>;
}
