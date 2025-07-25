import { createContext, useState } from 'react';

// Crée le contexte
export const Context = createContext();

// Crée le provider
export function ContextProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [isNoisePlaying, setIsNoisePlaying] = useState(false);
  const [isVillagePlaying, setIsVillagePlaying] = useState(false);
  const [isSpringPlaying, setIsSpringPlaying] = useState(false);
  const [isOceanPlaying, setIsOceanPlaying] = useState(false);
  const [isRainPlaying, setIsRainPlaying] = useState(false);
  const [isThunderPlaying, setIsThunderPlaying] = useState(false);
  const [customSound, setCustomSound] = useState(null);
  const [currentInput, setCurrentInput] = useState(null);

  return (
    <Context.Provider
      value={{
        theme,
        setTheme,
        isNoisePlaying,
        setIsNoisePlaying,
        isVillagePlaying,
        setIsVillagePlaying,
        isSpringPlaying,
        setIsSpringPlaying,
        isOceanPlaying,
        setIsOceanPlaying,
        isRainPlaying,
        setIsRainPlaying,
        isThunderPlaying,
        setIsThunderPlaying,
        customSound,
        setCustomSound,
        currentInput,
        setCurrentInput,
      }}
    >
      {children}
    </Context.Provider>
  );
}
