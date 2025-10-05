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
  } = useContext(Context);

  const [snapsToDisplay, setSnapsToDisplay] = useState([]);

  useEffect(() => {
    if (savedSnaps) {
      setSnapsToDisplay(Array.from(savedSnaps.values()));
    }
  }, [savedSnaps]);

  const handleLoadSavedSnap = (e, snapTitle) => {
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

  return (
    <div className="saved-snaps-container">
      {snapsToDisplay.length > 0 &&
        snapsToDisplay.map(snap => (
          <div
            className="saved-snap"
            key={snap.title}
            onClick={e => handleLoadSavedSnap(e, snap.title)}
          >
            {snap.title}{' '}
            <i
              data-id={snap.title}
              onClick={handleDelSnap}
              className="fa-solid fa-trash del-btn"
            ></i>
          </div>
        ))}
    </div>
  );
};
