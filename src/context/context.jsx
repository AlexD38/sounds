import { createContext, useState } from 'react';

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
    console.log('notif ok ');
  };

  const saveSnapshot = async snapshotMix => {
    localStorage.setItem('snapshot', snapshotMix);
    setNotification({ message: 'Successfully saved snapshot' });

    setTimeout(() => {
      setNotification(null);
      console.log('notif killed');
    }, 3000);
  };

  snapshotMix.set('whiteNoise', { isPLaying: true });

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
