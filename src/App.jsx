import { useRef, useState, useContext, useEffect } from 'react';
import './App.css';
import Player from './components/Player/Player';
import SearchSound from './components/SearchSound/SearchSound';
import { Context } from './context/context';
import villageSound from '/assets/sounds/village.mp3';
import monrningSound from '/assets/sounds/morning.mp3';
import springSound from '/assets/sounds/spring.mp3';
import oceanSound from '/assets/sounds/ocean.mp3';
import lightRainSound from '/assets/sounds/light-rain.mp3';
import rainSound from '/assets/sounds/rain.mp3';
import fireSound from '/assets/sounds/fire.mp3';
import thunderSound from '/assets/sounds/thunder.mp3';
import trainSound from '/assets/sounds/train.mp3';
import nightSound from '/assets/sounds/night.wav';
import scaryNightSound from '/assets/sounds/scaryNightForest.wav';
import crowSound from '/assets/sounds/crow.wav';
import chatterSound from '/assets/sounds/chatter.wav';
import satieSound from '/assets/sounds/gymnopedie.mp3';

import WhiteNoisePlayer from './components/WhiteNoisePlayer/WhiteNoisePlayer';
import { SaveSnapshotMix } from './components/SaveSnapshotMix/SaveSnapshotMix';
import { Notification } from './components/notification/notification';

import Stretcher from './strecther/Stretcher';
import windows from '/assets/sounds/windows.wav';
import pianoSound from '/assets/sounds/piano.mp3';
import { SavedSnaps } from './components/SavedSnaps/SavedSnaps';
import { StopAll } from './components/StopAll/StopAll';

function App() {
  const [response, setResponse] = useState(null);
  const { customSound, setCustomSound, savedSnaps, stopAll } =
    useContext(Context);
  const [title, setTitle] = useState(
    <>
      Ambient <i className="fa-solid fa-compass-drafting"></i> Architect
    </>
  );
  const [opacity, setOpacity] = useState(1);

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
        <WhiteNoisePlayer
          title={'whiteNoise'}
          custom="perlinNoise"
          stopAll={stopAll}
        />
        <Player
          title={'morning'}
          sourcePath={villageSound}
          custom="perlinNoise"
          stopAll={stopAll}
        />
        <Player
          title={'fire'}
          sourcePath={fireSound}
          custom="perlinNoise"
          stopAll={stopAll}
        />

        <Player
          title={'ocean'}
          sourcePath={oceanSound}
          custom="perlinNoise"
          speed={true}
          stopAll={stopAll}
        />
        <Player
          title={'lightRain'}
          sourcePath={lightRainSound}
          custom="perlinNoise"
          stopAll={stopAll}
        />
        <Player
          title={'rain'}
          sourcePath={rainSound}
          custom="perlinNoise"
          speed={true}
          stopAll={stopAll}
        />
        <Player
          title={'thunder'}
          sourcePath={thunderSound}
          custom="perlinNoise"
          speed={true}
          stopAll={stopAll}
        />
        <Player
          title={'train'}
          sourcePath={trainSound}
          custom="perlinNoise"
          speed={true}
          stopAll={stopAll}
        />
        <Player
          title={'night'}
          sourcePath={nightSound}
          custom="perlinNoise"
          speed={true}
          stopAll={stopAll}
        />
        <Player
          title={'scary'}
          sourcePath={scaryNightSound}
          custom="perlinNoise"
          speed={true}
          stopAll={stopAll}
        />
        <Player
          title={'crow'}
          sourcePath={crowSound}
          custom="perlinNoise"
          stopAll={stopAll}
        />
        <Player
          title={'chatter'}
          sourcePath={chatterSound}
          stopAll={stopAll}
          speed={true}
        />
        <Player
          title={'music'}
          sourcePath={'apiSearch'}
          custom={true}
          stopAll={stopAll}
          speed={true}
        />
      </main>
      <Notification />
    </>
  );
}

export default App;
