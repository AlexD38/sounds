import { useRef, useState, useContext } from 'react';
import './App.css';
import Slider from './components/slider/Slider';
import Player from './Player';
import SearchSound from './components/slider/SearchSound/SearchSound';
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
import Stretcher from './strecther/Stretcher';
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
      <Stretcher source={windows} custom="perlinNoise" />
      <Player title="Noise" custom="perlinNoise" />
      <Player
        title="Morning birds"
        sourcePath={monrningSound}
        custom="perlinNoise"
      />
      <Player title="Fireplace" sourcePath={fireSound} custom="perlinNoise" />
      <Player title="Village" sourcePath={villageSound} custom="perlinNoise" />
      <Player title="Spring" sourcePath={springSound} custom="perlinNoise" />
      <Player title="Ocean" sourcePath={oceanSound} custom="perlinNoise" />
      <Player
        title="LightRain"
        sourcePath={lightRainSound}
        custom="perlinNoise"
      />
      <Player title="Rain" sourcePath={rainSound} custom="perlinNoise" />
      <Player title="Thunder" sourcePath={thunderSound} custom="perlinNoise" />
    </>
  );
}

export default App;
