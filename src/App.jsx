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
import { Loader } from './components/Loader/Loader';

function App() {
  const { stopAll, cachedAudios, isReady, savedSnaps } = useContext(Context);
  const [opacity, setOpacity] = useState(1);
  const [loaderPerc, setLoaderPerc] = useState(0);
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

  useEffect(() => {
    const readyToDIsplay = [...new Set(isReady)];
    const percentage = ((readyToDIsplay.length + 2) / config.length) * 100;
    setLoaderPerc(percentage);
  }, [isReady]);

  return (
    <>
      <h1
        className="logo"
        style={{ opacity, transition: 'opacity 0.5s ease-in-out' }}
      >
        {title}
      </h1>
      {loaderPerc < 100 && <Loader perc={loaderPerc} quote={true} />}
      {loaderPerc >= 100 && (
        <>
          <StopAll />
          <SaveSnapshotMix />
          <Timer />
          <RandomSnapGenerator />
          {installPromptEvent && (
            <button className="pwa-install-button" onClick={handleInstallClick}>
              <i class="fa-solid fa-puzzle-piece"></i>Installer l'application
            </button>
          )}
          {/* <SearchSound /> */}
          {/* <Stretcher source={windows} custom="perlinNoise" /> */}
          {savedSnaps.size > 0 && <SavedSnaps />}
          <main>
            <>
              {config.map(player =>
                cachedAudios[player.title] ? (
                  <Player
                    key={player.title}
                    title={player.title}
                    sourcePath={cachedAudios[player.title]}
                    custom="perlinNoise"
                    stopAll={stopAll}
                    speed={player.speed || false} // si besoin
                  />
                ) : null
              )}
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
      )}
    </>
  );
}

export default App;
