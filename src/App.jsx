import { useRef, useState, useContext } from 'react';
import './App.css';
import Slider from './components/slider/Slider';
import Player from './Player';
import SearchSound from './components/slider/SearchSound/SearchSound';
import { Context } from './context/context';
import villageSound from '/assets/sounds/village.mp3';
import springSound from '/assets/sounds/spring.mp3';
import oceanSound from '/assets/sounds/ocean.mp3';
import rainSound from '/assets/sounds/rain.mp3';
import thunderSound from '/assets/sounds/thunder.mp3';
function App() {
  const [response, setResponse] = useState(null);
  const { customSound, setCustomSound } = useContext(Context);
  console.log('customSound: ', customSound);

  return (
    <>
      <SearchSound />
      {customSound && (
        <Player title={customSound.name} sourcePath={customSound.url} />
      )}

      <Player title="Noise" />
      <Player
        title="Morning birds"
        sourcePath="/public/assets/sounds/morning.mp3"
      />
      <Player title="Village" sourcePath={villageSound} />
      <Player title="Spring" sourcePath={springSound} />
      <Player title="Ocean" sourcePath={oceanSound} />
      <Player title="Rain" sourcePath={rainSound} />
      <Player title="Thunder" sourcePath={thunderSound} />
    </>
  );
}

export default App;
