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
    // 1. On crée une nouvelle Map
    const updatedSnaps = new Map(savedSnaps);
    // 2. On ajoute le nouveau snapshot
    updatedSnaps.set(snapShotTitle, formattedSnapshot);

    // 3. On utilise la fonction du contexte pour mettre à jour l'état et localforage
    setSavedSnaps(updatedSnaps);

    setNotification({ message: `Snapshot "${snapShotTitle}" saved!` });
    setTimeout(() => setNotification(null), 3000);

    setShowInput(false);
  };

  return (
    <>
      <div
        onClick={() => setShowInput(true)}
        className="snapshot-saver"
        title="Save current mix for later..."
      >
        <i className="fa-solid fa-floppy-disk"></i>
      </div>
      {showInput && (
        <div className="snapshot-title-container">
          <h3>Name your snapshot : </h3>
          <input className="snapshot-title-input" type="text" ref={inputRef} />
          <div className="snapshot-footer-container">
            <button onClick={handleSaveSnapshot}>Save</button>
            <button onClick={() => setShowInput(false)}>Cancel</button>
          </div>
        </div>
      )}
    </>
  );
};
