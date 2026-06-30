import { useContext, useEffect, useState } from 'react';
import './App.css';
import Player from './components/Player/Player';
import { Context } from './context/context';
import { Notification } from './components/notification/notification';
import { SavedSnaps } from './components/SavedSnaps/SavedSnaps';
import { BottomBar } from './components/BottomBar/BottomBar';
import { config } from './ref/random.config';

function App() {
  const { stopAll, savedSnaps: rawSavedSnaps } = useContext(Context);
  const savedSnaps =
    rawSavedSnaps instanceof Map
      ? rawSavedSnaps
      : new Map(rawSavedSnaps ?? []);
  const [titleShort, setTitleShort] = useState(false);
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

  const soundPlayers = config.filter(
    p => p.title !== 'whiteNoise' && p.title !== 'music'
  );

  return (
    <div className="app">
      <header className="app-header">
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

      <BottomBar
        installPromptEvent={installPromptEvent}
        onInstallClick={handleInstallClick}
      />
      <Notification />
    </div>
  );
}

export default App;
