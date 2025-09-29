import { useContext } from 'react';
import { Context } from '../../context/context';
import './styles.css';
import { handleSnapshotMix } from '../../utils/utils';

export const SaveSnapshotMix = () => {
  const { saveSnapshot } = useContext(Context);

  return (
    <div
      onClick={saveSnapshot}
      className="snapshot-saver"
      title="Save current mix for later..."
    >
      <i className="fa-solid fa-floppy-disk"></i>
    </div>
  );
};
