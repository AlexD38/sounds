import { useRef, useState, useContext } from 'react';
import './App.css';
import Slider from './components/Slider/Slider';
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
      <SearchSound />
      {customSound && (
        <Player
          title={customSound.title}
          sourcePath={customSound.url}
          custom={true}
        />
      )}
      {/* <Stretcher source={windows} custom="perlinNoise" /> */}
      <WhiteNoisePlayer
        title={<i className="fa-solid fa-ear-listen"></i>}
        custom="perlinNoise"
      />
      <Player
        title={<i className="fa-solid fa-dove"></i>}
        sourcePath={monrningSound}
        custom="perlinNoise"
      />
      <Player
        title={<i className="fa-solid fa-fire"></i>}
        sourcePath={fireSound}
        custom="perlinNoise"
      />
      <Player
        title={<i className="fa-solid fa-house"></i>}
        sourcePath={villageSound}
        custom="perlinNoise"
      />
      <Player
        title={<i className="fa-solid fa-seedling"></i>}
        sourcePath={springSound}
        custom="perlinNoise"
      />
      <Player
        title={<i className="fa-solid fa-water"></i>}
        sourcePath={oceanSound}
        custom="perlinNoise"
      />
      <Player
        title={<i className="fa-solid fa-cloud-rain"></i>}
        sourcePath={lightRainSound}
        custom="perlinNoise"
      />
      <Player
        title={<i className="fa-solid fa-umbrella"></i>}
        sourcePath={rainSound}
        custom="perlinNoise"
      />
      <Player
        title={<i className="fa-solid fa-cloud-bolt"></i>}
        sourcePath={thunderSound}
        custom="perlinNoise"
      />
      <Player
        title={<i className="fa-solid fa-train"></i>}
        sourcePath={trainSound}
        custom="perlinNoise"
      />
    </>
  );
}

export default App;
