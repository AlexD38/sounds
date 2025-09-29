import { createContext, useState } from 'react';

// Crée le contexte
export const Context = createContext();

// Crée le provider
export function ContextProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [customSound, setCustomSound] = useState(null);
  const [currentInput, setCurrentInput] = useState(null);
  const [snapshotMix, setSnapshotMix] = useState(new Map());

  const registerPlayerSituation = (title, obj) => {
    snapshotMix.set(title, obj);
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
      }}
    >
      {children}
    </Context.Provider>
  );
}
