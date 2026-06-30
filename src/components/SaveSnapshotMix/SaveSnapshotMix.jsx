import { useContext, useRef, useState } from 'react';
import { Context } from '../../context/context';
import './styles.css';

export const SaveSnapshotMix = () => {
  const { snapshotMix, savedSnaps, setSavedSnaps, setNotification } =
    useContext(Context);
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef(null);

  const handleSaveSnapshot = async () => {
    const snapShotTitle = inputRef.current.value;

    if (!snapShotTitle) {
      setNotification({ message: 'Please enter a name for your snapshot.' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const formattedSnapshot = { title: snapShotTitle, players: [] };

    let IsSavable = false;
    for (const [title, playerData] of snapshotMix.entries()) {
      if (playerData.isPlaying) {
        IsSavable = true;
      }
      formattedSnapshot.players.push({ playerTitle: title, ...playerData });
    }
    if (!IsSavable) {
      setShowInput(false);
      setNotification({ message: `You cannot save when nothing is playing !` });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const updatedSnaps = new Map(savedSnaps);
    updatedSnaps.set(snapShotTitle, formattedSnapshot);
    setSavedSnaps(updatedSnaps);

    setNotification({ message: `Snapshot "${snapShotTitle}" saved!` });
    setTimeout(() => setNotification(null), 3000);

    setShowInput(false);
  };

  return (
    <>
      <button
        type="button"
        className="bar-action"
        onClick={() => setShowInput(true)}
        aria-label="Save current mix"
      >
        <i className="fa-solid fa-floppy-disk" aria-hidden="true" />
        <span className="bar-action__label">Save</span>
      </button>
      {showInput && (
        <div
          className="snapshot-title-container"
          onClick={() => setShowInput(false)}
          role="presentation"
        >
          <div
            className="snapshot-modal"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-labelledby="snapshot-modal-title"
          >
            <h3 id="snapshot-modal-title" className="snapshot-modal__title">
              Save your mix
            </h3>
            <p className="snapshot-modal__hint">
              Give it a name to load it later
            </p>
            <input
              className="snapshot-title-input"
              type="text"
              ref={inputRef}
              placeholder="e.g. Rainy morning"
              autoFocus={true}
            />
            <div className="snapshot-footer-container">
              <button type="button" onClick={handleSaveSnapshot}>
                Save
              </button>
              <button type="button" onClick={() => setShowInput(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
