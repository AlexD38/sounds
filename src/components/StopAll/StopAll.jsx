import { useContext } from 'react';
import { Context } from '../../context/context';

export const StopAll = () => {
  const { setStopAll, setRandomSnap } = useContext(Context);

  const handleStopAll = () => {
    setStopAll(true);
    setRandomSnap(null);
  };

  return (
    <button
      type="button"
      className="bar-action"
      onClick={handleStopAll}
      aria-label="Stop all sounds"
    >
      <i className="fa-solid fa-pause" aria-hidden="true" />
      <span className="bar-action__label">Stop</span>
    </button>
  );
};
