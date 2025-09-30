import { createContext, useEffect, useState } from 'react';
import localforage from 'localforage';

// Crée le contexte
export const Context = createContext();

// Crée le provider
export function ContextProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [customSound, setCustomSound] = useState(null);
  const [currentInput, setCurrentInput] = useState(null);
  const [snapshotMix, setSnapshotMix] = useState(new Map());
  const [notification, setNotification] = useState(null);
  const [savedSnaps, setSavedSnaps] = useState(null);

  useEffect(() => {
    const getSavedSnaps = async () => {
      const savedSnaps = await localforage.getItem('snapshot');
      setSavedSnaps(savedSnaps);
    };

    getSavedSnaps();
  }, []);

  const registerPlayerSituation = (title, obj) => {
    const concernedObj = snapshotMix.get(title);
    if (!concernedObj) {
      snapshotMix.set(title, obj);
    } else {
      const prop = Object.keys(obj)[0];
      const value = obj[prop];
      concernedObj[prop] = value;
      snapshotMix.set(title, { ...concernedObj, [prop]: value });
    }
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

    await localforage.setItem('snapshot', serializableMap);
    setNotification({ message: 'Successfully saved snapshot' });

    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  return (
    <Context.Provider
      value={{
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
        savedSnaps,
      }}
    >
      {children}
    </Context.Provider>
  );
}
