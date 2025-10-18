import { useRef, useState, useContext, useEffect } from 'react';
import './App.css';
import Player from './components/Player/Player';
import { Context } from './context/context';
import villageSound from '/assets/sounds/village.mp3';
import oceanSound from '/assets/sounds/ocean.mp3';
import lightRainSound from '/assets/sounds/light-rain.mp3';
import rainSound from '/assets/sounds/rain.mp3';
import fireSound from '/assets/sounds/fire.mp3';
import thunderSound from '/assets/sounds/thunder.mp3';
import trainSound from '/assets/sounds/train.mp3';
import nightSound from '/assets/sounds/night.mp3';
import scaryNightSound from '/assets/sounds/scary.mp3';
import crowSound from '/assets/sounds/crow.mp3';
import chatterSound from '/assets/sounds/chatter.mp3';
import bowlSound from '/assets/sounds/bowl.mp3';
import windSound from '/assets/sounds/wind.mp3';
import lakeSound from '/assets/sounds/lake.mp3';
import birdWoodsSound from '/assets/sounds/birdWoods.mp3';

import { SaveSnapshotMix } from './components/SaveSnapshotMix/SaveSnapshotMix';
import { Notification } from './components/notification/notification';

import Stretcher from './strecther/Stretcher';
import { SavedSnaps } from './components/SavedSnaps/SavedSnaps';
import { StopAll } from './components/StopAll/StopAll';
import { config } from './ref/random.config';
import { RandomSnapGenerator } from './components/RandomSnapGenerator/RandomSnapGenerator';
import { Timer } from './components/timer/Timer';
import { cacheManager } from './utils/cacheManager';
import localforage from 'localforage';

function App() {
  const { stopAll, cachedAudio, setCachedAudios } = useContext(Context);
  const [opacity, setOpacity] = useState(1);
  const [cachedPlayers, setCachedPlayers] = useState({});
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

  //Cache ------------------------
  useEffect(() => {
    const fetchData = async () => {
      const cachedObj = cachedPlayers;

      let missing = false;

      for (const { title } of config) {
        if (title === 'whiteNoise' || title === 'music') continue;

        const cached = await localforage.getItem(title);
        cachedObj[title] = cached;

        if (!cached) {
          missing = true;
        }
      }

      // S’il manque des sons => on les décode + stocke
      if (missing) {
        const decodedSounds = await cacheManager.decodeSounds(config);
        setCachedPlayers(decodedSounds);
      } else {
        setCachedPlayers(cachedObj);
      }
    };

    fetchData();
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
          sourcePath={localforage.getItem('morning')}
          custom="perlinNoise"
          stopAll={stopAll}
        />
        <Player
          title={'fire'}
          sourcePath={cachedPlayers}
          custom="perlinNoise"
          stopAll={stopAll}
        />
        <Player
          title={'lake'}
          sourcePath={cachedPlayers.lakeSound}
          custom="perlinNoise"
          speed={true}
          stopAll={stopAll}
        />
        <Player
          title={'ocean'}
          sourcePath={cachedPlayers.oceanSound}
          custom="perlinNoise"
          speed={true}
          stopAll={stopAll}
        />
        <Player
          title={'lightRain'}
          sourcePath={cachedPlayers.lightRainSound}
          custom="perlinNoise"
          stopAll={stopAll}
        />
        <Player
          title={'rain'}
          sourcePath={cachedPlayers.rainSound}
          custom="perlinNoise"
          speed={true}
          stopAll={stopAll}
        />
        <Player
          title={'wind'}
          sourcePath={cachedPlayers.windSound}
          custom="perlinNoise"
          speed={true}
          stopAll={stopAll}
        />
        <Player
          title={'thunder'}
          sourcePath={cachedPlayers.thunderSound}
          custom="perlinNoise"
          speed={true}
          stopAll={stopAll}
        />
        <Player
          title={'train'}
          sourcePath={cachedPlayers.trainSound}
          custom="perlinNoise"
          speed={true}
          stopAll={stopAll}
        />
        <Player
          title={'night'}
          sourcePath={cachedPlayers.nightSound}
          custom="perlinNoise"
          speed={true}
          stopAll={stopAll}
        />
        <Player
          title={'scary'}
          sourcePath={cachedPlayers.scaryNightSound}
          custom="perlinNoise"
          speed={true}
          stopAll={stopAll}
        />
        <Player
          title={'crow'}
          sourcePath={cachedPlayers.crowSound}
          custom="perlinNoise"
          stopAll={stopAll}
        />
        <Player
          title={'chatter'}
          sourcePath={cachedPlayers.chatterSound}
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
          sourcePath={cachedPlayers.bowlSound}
          stopAll={stopAll}
        />
      </main>
      <Notification />
    </>
  );
}

export default App;
