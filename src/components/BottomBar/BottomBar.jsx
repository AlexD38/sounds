import { StopAll } from '../StopAll/StopAll';
import { SaveSnapshotMix } from '../SaveSnapshotMix/SaveSnapshotMix';
import { Timer } from '../timer/Timer';
import { RandomSnapGenerator } from '../RandomSnapGenerator/RandomSnapGenerator';
import './styles.css';

export function BottomBar({ installPromptEvent, onInstallClick }) {
  return (
    <nav className="bottom-bar" aria-label="Controls">
      <div className="bottom-bar__inner">
        <StopAll />
        <SaveSnapshotMix />
        <RandomSnapGenerator />
        <Timer />
        {installPromptEvent && (
          <button
            type="button"
            className="bar-action bar-action--install"
            onClick={onInstallClick}
            aria-label="Install application"
          >
            <i className="fa-solid fa-puzzle-piece" aria-hidden="true" />
            <span className="bar-action__label">Install</span>
          </button>
        )}
      </div>
    </nav>
  );
}
