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

function App() {
  const { stopAll, cachedAudios } = useContext(Context);
  const [opacity, setOpacity] = useState(1);
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
      {/* <SearchSound /> */}
      {/* <Player
        title={'random'}
        sourcePath={'apiSearch'}
        custom={true}
        speed={true}
      /> */}
      {/* <Stretcher source={windows} custom="perlinNoise" /> */}
      <SavedSnaps />
      <main>
        <Player title={'whiteNoise'} custom="perlinNoise" stopAll={stopAll} />
        {cachedAudios && (
          <>
            <Player
              title={'morning'}
              sourcePath={cachedAudios.morning}
              custom="perlinNoise"
              stopAll={stopAll}
            />
            <Player
              title={'fire'}
              sourcePath={cachedAudios.fire}
              custom="perlinNoise"
              stopAll={stopAll}
            />
            <Player
              title={'lake'}
              sourcePath={cachedAudios.lake}
              custom="perlinNoise"
              speed={true}
              stopAll={stopAll}
            />
            <Player
              title={'ocean'}
              sourcePath={cachedAudios.ocean}
              custom="perlinNoise"
              speed={true}
              stopAll={stopAll}
            />
            <Player
              title={'lightRain'}
              sourcePath={cachedAudios.lightRain}
              custom="perlinNoise"
              stopAll={stopAll}
            />
            <Player
              title={'rain'}
              sourcePath={cachedAudios.heavyRain}
              custom="perlinNoise"
              speed={true}
              stopAll={stopAll}
            />
            <Player
              title={'wind'}
              sourcePath={cachedAudios.wind}
              custom="perlinNoise"
              speed={true}
              stopAll={stopAll}
            />
            <Player
              title={'thunder'}
              sourcePath={cachedAudios.thunder}
              custom="perlinNoise"
              speed={true}
              stopAll={stopAll}
            />
            <Player
              title={'train'}
              sourcePath={cachedAudios.train}
              custom="perlinNoise"
              speed={true}
              stopAll={stopAll}
            />
            <Player
              title={'night'}
              sourcePath={cachedAudios.night}
              custom="perlinNoise"
              speed={true}
              stopAll={stopAll}
            />
            <Player
              title={'scary'}
              sourcePath={cachedAudios.scary}
              custom="perlinNoise"
              speed={true}
              stopAll={stopAll}
            />
            <Player
              title={'crow'}
              sourcePath={cachedAudios.crow}
              custom="perlinNoise"
              stopAll={stopAll}
            />
            <Player
              title={'chatter'}
              sourcePath={cachedAudios.chatter}
              speed={true}
              stopAll={stopAll}
            />
            <Player
              title={'music'}
              sourcePath={'apiSearch'}
              custom={true}
              speed={true}
              stopAll={stopAll}
            />
            <Player
              title={'bowl'}
              sourcePath={cachedAudios.bowl}
              stopAll={stopAll}
            />
          </>
        )}
      </main>
      <Notification />
    </>
  );
}

export default App;
