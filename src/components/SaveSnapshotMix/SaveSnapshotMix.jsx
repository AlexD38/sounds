import { useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Context } from '../../context/context';
import './styles.css';

export const SaveSnapshotMix = () => {
  const { snapshotMix, savedSnaps, setSavedSnaps, setNotification } =
    useContext(Context);
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!showInput) return;

    const handleKeyDown = e => {
      if (e.key === 'Escape') setShowInput(false);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showInput]);

  const handleSaveSnapshot = async () => {
    const snapShotTitle = inputRef.current?.value?.trim();

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

  const modal =
    showInput &&
    createPortal(
      <div
        className="snapshot-overlay"
        onClick={() => setShowInput(false)}
        role="presentation"
      >
        <div
          className="snapshot-modal"
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="snapshot-modal-title"
        >
          <button
            type="button"
            className="snapshot-modal__close"
            onClick={() => setShowInput(false)}
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
          <h3 id="snapshot-modal-title" className="snapshot-modal__title">
            Save your mix
          </h3>
          <p className="snapshot-modal__hint">
            Give it a name to load it later
          </p>
          <input
            className="snapshot-modal__input"
            type="text"
            ref={inputRef}
            placeholder="e.g. Rainy morning"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') handleSaveSnapshot();
            }}
          />
          <div className="snapshot-modal__actions">
            <button
              type="button"
              className="snapshot-modal__btn snapshot-modal__btn--primary"
              onClick={handleSaveSnapshot}
            >
              Save
            </button>
            <button
              type="button"
              className="snapshot-modal__btn snapshot-modal__btn--secondary"
              onClick={() => setShowInput(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <div className="bar-action-wrapper">
        <button
          type="button"
          className="bar-action"
          onClick={() => setShowInput(true)}
          aria-label="Save current mix"
        >
          <i className="fa-solid fa-floppy-disk" aria-hidden="true" />
          <span className="bar-action__label">Save</span>
        </button>
      </div>
      {modal}
    </>
  );
};
