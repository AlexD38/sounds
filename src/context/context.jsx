import { createContext, useState } from 'react';
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

  const registerPlayerSituation = (title, obj) => {
    snapshotMix.set(title, obj);
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

    snapshotMix.forEach((value, key) => {
      // On extrait seulement les propriétés utilisables
      serializableMap.set(key, {
        isPlaying: value.isPlaying ?? false,
        volume: value.volume ?? 1,
        // ajoute ici uniquement les props primitives/JSON-compatibles
      });
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
      }}
    >
      {children}
    </Context.Provider>
  );
}
