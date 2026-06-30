import { useContext, useEffect, useState } from 'react';
import './App.css';
import Player from './components/Player/Player';
import { Context } from './context/context';
import { Notification } from './components/notification/notification';
import { SavedSnaps } from './components/SavedSnaps/SavedSnaps';
import { ActiveMixDock } from './components/ActiveMixDock/ActiveMixDock';
import { ActiveMixBanner } from './components/ActiveMixBanner/ActiveMixBanner';
import { ThemePicker } from './components/ThemePicker/ThemePicker';
import { BottomBar } from './components/BottomBar/BottomBar';
import { config } from './ref/random.config';

function App() {
  const { stopAll, savedSnaps: rawSavedSnaps } = useContext(Context);
  const savedSnaps =
    rawSavedSnaps instanceof Map
      ? rawSavedSnaps
      : new Map(rawSavedSnaps ?? []);
  const [titleShort, setTitleShort] = useState(false);
  const [headerOpacity, setHeaderOpacity] = useState(1);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = event => {
      event.preventDefault();
      setInstallPromptEvent(event);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
    };
  }, []);

  const handleInstallClick = () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      installPromptEvent.userChoice.then(() => {
        setInstallPromptEvent(null);
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setTitleShort(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const FADE_START = 8;
    const FADE_END = 72;

    const updateHeaderOpacity = () => {
      const scrollY = window.scrollY;
      if (scrollY <= FADE_START) {
        setHeaderOpacity(1);
        return;
      }
      if (scrollY >= FADE_END) {
        setHeaderOpacity(0);
        return;
      }
      setHeaderOpacity(1 - (scrollY - FADE_START) / (FADE_END - FADE_START));
    };

    updateHeaderOpacity();
    window.addEventListener('scroll', updateHeaderOpacity, { passive: true });
    return () => window.removeEventListener('scroll', updateHeaderOpacity);
  }, []);

  const soundPlayers = config.filter(
    p => p.title !== 'whiteNoise' && p.title !== 'music'
  );

  return (
    <div className="app">
      <header
        className="app-header"
        style={{
          opacity: headerOpacity,
          pointerEvents: headerOpacity < 0.05 ? 'none' : 'auto',
        }}
      >
        <ThemePicker />
        <div className={`app-header__brand${titleShort ? ' app-header__brand--short' : ''}`}>
          {titleShort ? (
            <>
              <span className="app-header__mark">A</span>
              <i className="fa-solid fa-compass-drafting app-header__compass" aria-hidden="true" />
              <span className="app-header__mark">A</span>
            </>
          ) : (
            <>
              <span className="app-header__word">Ambient</span>
              <i className="fa-solid fa-compass-drafting app-header__compass" aria-hidden="true" />
              <span className="app-header__word">Architect</span>
            </>
          )}
        </div>
        <p className="app-header__tagline">Mix your focus soundscape</p>
      </header>

      <ActiveMixBanner />

      {savedSnaps.size > 0 && <SavedSnaps />}

      <main className="sound-grid" aria-label="Sound library">
        {soundPlayers.map(player => (
          <Player
            key={player.title}
            title={player.title}
            sourcePath={`/assets/sounds/${player.title}.mp3`}
            custom="perlinNoise"
            stopAll={stopAll}
            speed={player.speed || false}
          />
        ))}
        <Player title="whiteNoise" custom="perlinNoise" stopAll={stopAll} />
        <Player
          title="music"
          sourcePath="apiSearch"
          custom={true}
          speed={true}
          stopAll={stopAll}
        />
      </main>

      <ActiveMixDock />
      <BottomBar
        installPromptEvent={installPromptEvent}
        onInstallClick={handleInstallClick}
      />
      <Notification />
    </div>
  );
}

export default App;
