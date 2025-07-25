import { useRef, useState, useContext } from 'react';
import './App.css';
import Slider from './components/slider/Slider';
import Player from './Player';
import SearchSound from './components/slider/SearchSound/SearchSound';
import { Context } from './context/context';

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
      <Player title="Village" sourcePath="/public/assets/sounds/village.mp3" />
      <Player title="Spring" sourcePath="/public/assets/sounds/spring.mp3" />
      <Player title="Ocean" sourcePath="/public/assets/sounds/ocean.mp3" />
      <Player title="Rain" sourcePath="/public/assets/sounds/rain.mp3" />
      <Player title="Thunder" sourcePath="/public/assets/sounds/thunder.mp3" />
    </>
  );
}

export default App;
