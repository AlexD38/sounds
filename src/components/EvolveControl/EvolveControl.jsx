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
        <i className="evolve-control__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 5C10.9 11 13 13.1 19 14C13 14.9 10.9 17 10 23C9.1 17 7 14.9 1 14C7 13.1 9.1 11 10 5Z" />
            <path d="M18.5 1C18.95 4 20 5.05 23 5.5C20 5.95 18.95 7 18.5 10C18.05 7 17 5.95 14 5.5C17 5.05 18.05 4 18.5 1Z" />
          </svg>
        </i>
        <span className="bar-action__label">Evolve</span>
      </button>
    </div>
  );
}
