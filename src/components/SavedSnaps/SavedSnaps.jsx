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
  } = useContext(Context);

  const [snapsToDisplay, setSnapsToDisplay] = useState([]);
  const [hoveredSnapTitle, setHoveredSnapTitle] = useState(null);

  useEffect(() => {
    if (savedSnaps) {
      setSnapsToDisplay(Array.from(savedSnaps.values()));
    }
  }, [savedSnaps]);

  const handleLoadSavedSnap = snapTitle => {
    setPlayingSnap(snapTitle);

    setNotification({
      message: `Now playing "${snapTitle}"`,
    });
    setLoadASnap(true);

    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleDelSnap = () => {
    setNotification({
      message: `Successfully deleted  "${hoveredSnapTitle}"`,
    });

    savedSnaps.delete(hoveredSnapTitle);
    setSavedSnaps(savedSnaps);
  };

  return (
    <div className="saved-snaps-container">
      {snapsToDisplay.length > 0 &&
        snapsToDisplay.map(snap => (
          <div
            className="saved-snap"
            key={snap.title}
            onClick={() => handleLoadSavedSnap(snap.title)}
            onMouseEnter={() => setHoveredSnapTitle(snap.title)}
            onMouseLeave={() => setHoveredSnapTitle(null)}
          >
            {snap.title}{' '}
            {/* {hoveredSnapTitle === snap.title && (
              <i
                className="fa-solid fa-trash"
                onClick={() => handleDelSnap}
              ></i>
            )} */}
          </div>
        ))}
    </div>
  );
};
