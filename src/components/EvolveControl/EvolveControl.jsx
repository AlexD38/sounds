import { useContext } from 'react';
import { Context } from '../../context/context';
import { formatEvolveInterval } from '../../utils/evolveMix';
import './styles.css';

export function EvolveControl() {
  const { snapshotMix, evolveEnabled, setEvolveEnabled } = useContext(Context);

  const hasPlaying = Array.from(snapshotMix.values()).some(p => p?.isPlaying);
  const canUse = hasPlaying || evolveEnabled;

  const toggle = () => {
    if (!canUse) return;
    setEvolveEnabled(!evolveEnabled);
  };

  return (
    <div className="bar-action-wrapper evolve-control">
      <button
        type="button"
        className={`bar-action${evolveEnabled ? ' bar-action--active' : ''}${
          !canUse ? ' bar-action--disabled' : ''
        }`}
        onClick={toggle}
        disabled={!canUse}
        aria-pressed={evolveEnabled}
        aria-label={
          evolveEnabled
            ? `Evolve on, ${formatEvolveInterval()}. Tap to stop.`
            : 'Evolve mix'
        }
      >
        <i className="fa-solid fa-seedling" aria-hidden="true" />
        <span className="bar-action__label">Evolve</span>
      </button>
    </div>
  );
}
