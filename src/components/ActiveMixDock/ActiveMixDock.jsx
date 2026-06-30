import { useContext, useMemo } from 'react';
import { Context } from '../../context/context';
import './styles.css';

export function ActiveMixDock() {
  const { snapshotMix } = useContext(Context);

  const playingCount = useMemo(() => {
    let count = 0;
    for (const player of snapshotMix.values()) {
      if (player.isPlaying) count += 1;
    }
    return count;
  }, [snapshotMix]);

  return (
    <aside
      className={`active-mix-dock${playingCount > 0 ? ' active-mix-dock--visible' : ''}`}
      aria-label="Now playing"
      aria-hidden={playingCount === 0}
    >
      <div className="active-mix-dock__header">
        <span className="active-mix-dock__title">Now playing</span>
        <span className="active-mix-dock__count">{playingCount}</span>
      </div>
      <div id="active-mix-portal" className="active-mix-dock__cards" />
    </aside>
  );
}
