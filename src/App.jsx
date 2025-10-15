import { useRef, useState, useContext, useEffect } from 'react';
import './App.css';
import Player from './components/Player/Player';
import SearchSound from './components/SearchSound/SearchSound';
import { Context } from './context/context';
import villageSound from '/assets/sounds/village.wav';
import monrningSound from '/assets/sounds/morning.wav';
import springSound from '/assets/sounds/spring.wav';
import oceanSound from '/assets/sounds/ocean.wav';
import lightRainSound from '/assets/sounds/light-rain.wav';
import rainSound from '/assets/sounds/rain.wav';
import fireSound from '/assets/sounds/fire.wav';
import thunderSound from '/assets/sounds/thunder.wav';
import trainSound from '/assets/sounds/train.wav';
import nightSound from '/assets/sounds/night.wav';
import scaryNightSound from '/assets/sounds/scaryNightForest.wav';
import crowSound from '/assets/sounds/crow.wav';
import chatterSound from '/assets/sounds/chatter.wav';
import satieSound from '/assets/sounds/gymnopedie.wav';
import bowlSound from '/assets/sounds/bowl.wav';
import windSound from '/assets/sounds/wind.wav';
import lakeSound from '/assets/sounds/lake.wav';
import birdWoodsSound from '/assets/sounds/birdWoods.wav';

import { SaveSnapshotMix } from './components/SaveSnapshotMix/SaveSnapshotMix';
import { Notification } from './components/notification/notification';

import Stretcher from './strecther/Stretcher';
import { SavedSnaps } from './components/SavedSnaps/SavedSnaps';
import { StopAll } from './components/StopAll/StopAll';
import { config } from './ref/random.config';
import { RandomSnapGenerator } from './components/RandomSnapGenerator/RandomSnapGenerator';
import { Timer } from './components/timer/Timer';

function App() {
  const { stopAll } = useContext(Context);
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
        <Player
          title={'morning'}
          sourcePath={birdWoodsSound}
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
          title={'lake'}
          sourcePath={lakeSound}
          custom="perlinNoise"
          speed={true}
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
          title={'wind'}
          sourcePath={windSound}
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
        <Player title={'bowl'} sourcePath={bowlSound} stopAll={stopAll} />
      </main>
      <Notification />
    </>
  );
}

export default App;
