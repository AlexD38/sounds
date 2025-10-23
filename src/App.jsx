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
      {loaderPerc == 100 && (
        <>
          <StopAll />
          <SaveSnapshotMix />
          <Timer />
          <RandomSnapGenerator />
          {/* <SearchSound /> */}
          {/* <Player
        title={'random'}
        sourcePath={'apiSearch'}
        custom={true}
        speed={true}
      /> */}
          {/* <Stretcher source={windows} custom="perlinNoise" /> */}
          {savedSnaps.size > 0 && <SavedSnaps />}
          <main>
            <>
              <Player
                title={'whiteNoise'}
                custom="perlinNoise"
                stopAll={stopAll}
              />
              {isReady.includes('morning') && (
                <Player
                  title={'morning'}
                  sourcePath={cachedAudios.morning}
                  custom="perlinNoise"
                  stopAll={stopAll}
                />
              )}
              {isReady.includes('fire') && (
                <Player
                  title={'fire'}
                  sourcePath={cachedAudios.fire}
                  custom="perlinNoise"
                  stopAll={stopAll}
                />
              )}
              {isReady.includes('book') && (
                <Player
                  title={'book'}
                  sourcePath={cachedAudios.book}
                  stopAll={stopAll}
                />
              )}
              {isReady.includes('writing') && (
                <Player
                  title={'writing'}
                  sourcePath={cachedAudios.writing}
                  custom="perlinNoise"
                  stopAll={stopAll}
                  speed={true}
                />
              )}
              {isReady.includes('lake') && (
                <Player
                  title={'lake'}
                  sourcePath={cachedAudios.lake}
                  custom="perlinNoise"
                  speed={true}
                  stopAll={stopAll}
                />
              )}
              {isReady.includes('ocean') && (
                <Player
                  title={'ocean'}
                  sourcePath={cachedAudios.ocean}
                  custom="perlinNoise"
                  speed={true}
                  stopAll={stopAll}
                />
              )}
              {isReady.includes('lightRain') && (
                <Player
                  title={'lightRain'}
                  sourcePath={cachedAudios.lightRain}
                  custom="perlinNoise"
                  stopAll={stopAll}
                />
              )}
              {isReady.includes('heavyRain') && (
                <Player
                  title={'rain'}
                  sourcePath={cachedAudios.heavyRain}
                  custom="perlinNoise"
                  speed={true}
                  stopAll={stopAll}
                />
              )}
              {isReady.includes('wind') && (
                <Player
                  title={'wind'}
                  sourcePath={cachedAudios.wind}
                  custom="perlinNoise"
                  speed={true}
                  stopAll={stopAll}
                />
              )}
              {isReady.includes('thunder') && (
                <Player
                  title={'thunder'}
                  sourcePath={cachedAudios.thunder}
                  speed={true}
                  stopAll={stopAll}
                />
              )}
              {isReady.includes('train') && (
                <Player
                  title={'train'}
                  sourcePath={cachedAudios.train}
                  custom="perlinNoise"
                  speed={true}
                  stopAll={stopAll}
                />
              )}
              {isReady.includes('night') && (
                <Player
                  title={'night'}
                  sourcePath={cachedAudios.night}
                  custom="perlinNoise"
                  speed={true}
                  stopAll={stopAll}
                />
              )}
              {isReady.includes('scary') && (
                <Player
                  title={'scary'}
                  sourcePath={cachedAudios.scary}
                  speed={true}
                  stopAll={stopAll}
                />
              )}
              {isReady.includes('crow') && (
                <Player
                  title={'crow'}
                  sourcePath={cachedAudios.crow}
                  stopAll={stopAll}
                />
              )}
              {isReady.includes('chatter') && (
                <Player
                  title={'chatter'}
                  sourcePath={cachedAudios.chatter}
                  speed={true}
                  stopAll={stopAll}
                />
              )}
              <Player
                title={'music'}
                sourcePath={'apiSearch'}
                custom={true}
                speed={true}
                stopAll={stopAll}
              />
              {isReady.includes('bowl') && (
                <Player
                  title={'bowl'}
                  sourcePath={cachedAudios.bowl}
                  stopAll={stopAll}
                />
              )}
            </>
          </main>
          <Notification />
        </>
      )}
    </>
  );
}

export default App;
