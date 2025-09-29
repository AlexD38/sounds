import { useContext } from 'react';
import { Context } from '../../context/context';
import './styles.css';
import { handleSnapshotMix } from '../../utils/utils';

export const SaveSnapshotMix = () => {
  const { snapshotMix } = useContext(Context);

  const handleSaveSnapshot = () => {
    console.log(snapshotMix);
    // save snapshot into localstorage here ?
    // snapshotMix
  };
  return (
    <div
      onClick={handleSaveSnapshot}
      className="snapshot-saver"
      title="Save current mix for later..."
    >
      <i className="fa-solid fa-floppy-disk"></i>
    </div>
  );
};
