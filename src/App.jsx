import { useContext, useEffect, useState } from 'react';
import './App.css';
import Player from './components/Player/Player';
import { Context } from './context/context';

import { SaveSnapshotMix } from './components/SaveSnapshotMix/SaveSnapshotMix';
import { Notification } from './components/notification/notification';

import { RandomSnapGenerator } from './components/RandomSnapGenerator/RandomSnapGenerator';
import { SavedSnaps } from './components/SavedSnaps/SavedSnaps';
import { StopAll } from './components/StopAll/StopAll';
import { Timer } from './components/timer/Timer';
import { config } from './ref/random.config';

function App() {
  const { stopAll, savedSnaps: rawSavedSnaps } = useContext(Context);
  const savedSnaps =
    rawSavedSnaps instanceof Map
      ? rawSavedSnaps
      : new Map(rawSavedSnaps ?? []);
  const [opacity, setOpacity] = useState(1);
  const [title, setTitle] = useState(
    <>
      Ambient <i className="fa-solid fa-compass-drafting"></i> Architect
    </>
  );
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
      installPromptEvent.userChoice.then(choiceResult => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        }
        setInstallPromptEvent(null);
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setOpacity(0);
      setTimeout(() => {
        setTitle(
          <>
            A <i className="fa-solid fa-compass-drafting"></i> A
          </>
        );
        setOpacity(1);
      }, 500);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <h1
        className="logo"
        style={{ opacity, transition: 'opacity 0.5s ease-in-out' }}
      >
        {title}
      </h1>
      <StopAll />
      <SaveSnapshotMix />
      <Timer />
      <RandomSnapGenerator />
      {installPromptEvent && (
        <button className="pwa-install-button" onClick={handleInstallClick}>
          <i className="fa-solid fa-puzzle-piece"></i>Installer
          l'application
        </button>
      )}
      {/* <SearchSound /> */}
      {/* <Stretcher source={windows} custom="perlinNoise" /> */}
      {savedSnaps.size > 0 && <SavedSnaps />}
      <main>
        <>
          {config.map(player => {
            if (player.title === 'whiteNoise' || player.title === 'music')
              return null;
            return (
              <Player
                key={player.title}
                title={player.title}
                sourcePath={`/assets/sounds/${player.title}.mp3`}
                custom="perlinNoise"
                stopAll={stopAll}
                speed={player.speed || false}
              />
            );
          })}
          <Player
            title={'whiteNoise'}
            custom="perlinNoise"
            stopAll={stopAll}
          />

          <Player
            title={'music'}
            sourcePath={'apiSearch'}
            custom={true}
            speed={true}
            stopAll={stopAll}
          />
        </>
      </main>
      <Notification />
    </>
  );
}

export default App;
