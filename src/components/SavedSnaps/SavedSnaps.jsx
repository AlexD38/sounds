import { useContext, useEffect } from 'react';
import { Context } from '../../context/context';
import './styles.css';

export const SavedSnaps = () => {
  const { savedSnaps, setSavedSnaps, setNotification, setLoadASnap } =
    useContext(Context);

  useEffect(() => {
    if (!savedSnaps) {
      return;
    }
  }, [savedSnaps, setSavedSnaps]);
  const handleLoadSavedSnap = () => {
    setNotification({
      message: `Now playing "${savedSnaps.title}"`,
    });
    setLoadASnap(true);

    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  return (
    <div className="saved-snaps-container">
      {savedSnaps && (
        <div className="saved-snap" onClick={handleLoadSavedSnap}>
          {savedSnaps.title}
        </div>
      )}
    </div>
  );
};
