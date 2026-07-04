import { useContext } from 'react';
import { Context } from '../../context/context';
import './styles.css';
import './styles.css';

export function SavedSnapsList({ onLoad }) {
  const {
    savedSnaps,
    setSavedSnaps,
    setNotification,
    loadMix,
    activeMix,
  } = useContext(Context);

  const snapsToDisplay = Array.from(savedSnaps?.values() ?? []);

  if (snapsToDisplay.length === 0) {
    return (
      <p className="saved-snaps-empty">
        No saved mixes yet. Play some sounds and tap Save.
      </p>
    );
  }

  const handleLoadSavedSnap = snapTitle => {
    loadMix({
      label: snapTitle,
      snapMap: null,
      activeMix: { type: 'saved', label: snapTitle },
    });

    setNotification({
      message: `Now playing "${snapTitle}"`,
    });
    setTimeout(() => setNotification(null), 3000);
    onLoad?.();
  };

  const handleDelSnap = (event, snapTitle) => {
    event.stopPropagation();
    setNotification({
      message: `Successfully deleted  "${snapTitle}"`,
    });
    const updatedSnaps = new Map(savedSnaps);
    updatedSnaps.delete(snapTitle);
    setSavedSnaps(updatedSnaps);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="saved-snaps-container">
      {snapsToDisplay.map(snap => {
        const isActive =
          activeMix?.type === 'saved' && activeMix?.label === snap.title;

        return (
          <div
            className={`saved-snap${isActive ? ' saved-snap--active' : ''}`}
            key={snap.title}
          >
            <button
              type="button"
              className="saved-snap__play"
              onClick={() => handleLoadSavedSnap(snap.title)}
              aria-label={`Play mix ${snap.title}`}
              aria-pressed={isActive}
            >
              <i
                className={`fa-solid ${isActive ? 'fa-circle-play' : 'fa-play'} saved-snap__play-icon`}
                aria-hidden="true"
              />
              <span className="saved-snap__label">{snap.title}</span>
            </button>
            <button
              type="button"
              className="saved-snap__delete"
              data-id={snap.title}
              onClick={event => handleDelSnap(event, snap.title)}
              aria-label={`Delete mix ${snap.title}`}
            >
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
