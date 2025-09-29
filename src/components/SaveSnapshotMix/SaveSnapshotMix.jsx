import { useContext, useRef, useState } from 'react';
import { Context } from '../../context/context';
import './styles.css';
import { handleSnapshotMix } from '../../utils/utils';

export const SaveSnapshotMix = () => {
  const { saveSnapshot, isSavable, snapshotMix } = useContext(Context);
  const [showInput, setShowInput] = useState(false);
  const inputRef = useRef(null);

  const handleSaveSnapshot = () => {
    const snapShotTitle = inputRef.current.value;
    snapshotMix.set('snapshotTitle', { title: snapShotTitle });
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
