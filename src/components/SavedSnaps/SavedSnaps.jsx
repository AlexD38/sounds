import { useContext, useEffect, useState } from 'react';
import { Context } from '../../context/context';
import './styles.css';

export const SavedSnaps = () => {
  const {
    savedSnaps,
    setSavedSnaps,
    setNotification,
    setLoadASnap,
    setPlayingSnap,
    setStopAll,
    setRandomSnap,
  } = useContext(Context);

  const [snapsToDisplay, setSnapsToDisplay] = useState([]);

  useEffect(() => {
    if (savedSnaps) {
      setSnapsToDisplay(Array.from(savedSnaps.values()));
    }
  }, [savedSnaps]);

  const handleLoadSavedSnap = snapTitle => {
    setRandomSnap(null);
    setStopAll(false);
    setPlayingSnap(snapTitle);
    setNotification({
      message: `Now playing "${snapTitle}"`,
    });
    setLoadASnap(true);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleDelSnap = (e, snapTitle) => {
    e.stopPropagation();
    setNotification({
      message: `Successfully deleted  "${snapTitle}"`,
    });
    const updatedSnaps = new Map(savedSnaps);
    updatedSnaps.delete(snapTitle);
    setSavedSnaps(updatedSnaps);
    setTimeout(() => setNotification(null), 3000);
  };

  if (snapsToDisplay.length === 0) return null;

  return (
    <section className="saved-section" aria-label="Saved mixes">
      <div className="saved-section__header">
        <h2 className="saved-section__title">Your mixes</h2>
        <span className="saved-section__count">{snapsToDisplay.length}</span>
      </div>
      <div className="saved-snaps-container">
        {snapsToDisplay.map(snap => (
          <div className="saved-snap" key={snap.title}>
            <button
              type="button"
              className="saved-snap__play"
              onClick={() => handleLoadSavedSnap(snap.title)}
              aria-label={`Play mix ${snap.title}`}
            >
              <i className="fa-solid fa-play saved-snap__play-icon" aria-hidden="true" />
              <span className="saved-snap__label">{snap.title}</span>
            </button>
            <button
              type="button"
              className="saved-snap__delete"
              data-id={snap.title}
              onClick={e => handleDelSnap(e, snap.title)}
              aria-label={`Delete mix ${snap.title}`}
            >
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};
