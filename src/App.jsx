import { useRef, useState, useContext } from 'react';
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
import pianoSound from '/assets/sounds/piano.mp3';
import fireSound from '/assets/sounds/fire.mp3';
import windows from '/assets/sounds/windows.wav';
import thunderSound from '/assets/sounds/thunder.mp3';
import trainSound from '/assets/sounds/train.mp3';
import Stretcher from './strecther/Stretcher';
import WhiteNoisePlayer from './components/WhiteNoisePlayer/WhiteNoisePlayer';
function App() {
  const [response, setResponse] = useState(null);
  const { customSound, setCustomSound } = useContext(Context);

  return (
    <>
      <h1 className="logo">Safe & Sounds</h1>
      <SearchSound />
      {customSound && (
        <Player
          title={customSound.title}
          sourcePath={customSound.url}
          custom={true}
        />
      )}

      {/* <Stretcher source={windows} custom="perlinNoise" /> */}

      <WhiteNoisePlayer custom="perlinNoise" />

      <Player
        title={'morning'}
        sourcePath={monrningSound}
        custom="perlinNoise"
      />

      <Player title={'fire'} sourcePath={fireSound} custom="perlinNoise" />

      <Player
        title={'village'}
        sourcePath={villageSound}
        custom="perlinNoise"
      />

      <Player title={'srping'} sourcePath={springSound} custom="perlinNoise" />

      <Player
        title={'ocean'}
        sourcePath={oceanSound}
        custom="perlinNoise"
        speed={true}
      />

      <Player
        title={'lightRain'}
        sourcePath={lightRainSound}
        custom="perlinNoise"
      />

      <Player
        title={'rain'}
        sourcePath={rainSound}
        custom="perlinNoise"
        speed={true}
      />

      <Player
        title={'thunder'}
        sourcePath={thunderSound}
        custom="perlinNoise"
        speed={true}
      />

      <Player
        title={'train'}
        sourcePath={trainSound}
        custom="perlinNoise"
        speed={true}
      />
    </>
  );
}

export default App;
