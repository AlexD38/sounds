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

  const handleLoadSavedSnap = (e, snapTitle) => {
    setRandomSnap(null);
    if (e.target.dataset.id) {
      return;
    }
    setStopAll(false);
    setPlayingSnap(snapTitle);

    setNotification({
      message: `Now playing "${snapTitle}"`,
    });
    setLoadASnap(true);

    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleDelSnap = e => {
    e.stopPropagation();
    const snapTitle = e.currentTarget.dataset.id;

    setNotification({
      message: `Successfully deleted  "${snapTitle}"`,
    });

    const updatedSnaps = new Map(savedSnaps);
    updatedSnaps.delete(snapTitle);

    setSavedSnaps(updatedSnaps);
    setTimeout(() => {
      setNotification(null);
    }, 3000);
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
          <div
            className="saved-snap"
            key={snap.title}
            onClick={e => handleLoadSavedSnap(e, snap.title)}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter') handleLoadSavedSnap(e, snap.title);
            }}
          >
            {snap.title}
            <i
              data-id={snap.title}
              onClick={handleDelSnap}
              className="fa-solid fa-xmark del-btn"
              aria-label={`Delete ${snap.title}`}
            />
          </div>
        ))}
      </div>
    </section>
  );
};
