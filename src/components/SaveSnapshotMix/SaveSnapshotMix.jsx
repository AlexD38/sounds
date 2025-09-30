import { useContext, useRef, useState } from 'react';
import { Context } from '../../context/context';
import './styles.css';
import localforage from 'localforage';

export const SaveSnapshotMix = () => {
  const { saveSnapshot, isSavable, snapshotMix } = useContext(Context);
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef(null);

  const handleSaveSnapshot = async () => {
    const formattedSnapshot = { title: null, players: [] };
    const snapShotTitle = inputRef.current.value;
    formattedSnapshot.title = snapShotTitle;

    for (const obj of snapshotMix.entries()) {
      const title = obj[0];
      formattedSnapshot.players.push({ playerTitle: title, ...obj[1] });
    }
    console.log('formattedSnapshot: ', formattedSnapshot);
    await localforage.setItem('savedSnapshot', formattedSnapshot);
    setShowInput(false);
    saveSnapshot();
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
