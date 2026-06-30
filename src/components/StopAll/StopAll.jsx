import { useContext } from 'react';
import './styles.css';
import { Context } from '../../context/context';

export const StopAll = () => {
  const { setStopAll, setRandomSnap } = useContext(Context);

  const handleStopAll = () => {
    setStopAll(true);
    setRandomSnap(null);
  };

  return (
    <div className="stop-all-container">
      <i className="fa-solid fa-pause" onClick={handleStopAll}></i>
    </div>
  );
};
