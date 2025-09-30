import { useContext, useRef, useState, useEffect } from 'react';
import '../../App.css';
import { Context } from '../../context/context';
import { soundTools } from '../../utils/modulateSound.tools';

function WhiteNoisePlayer({ custom }) {
  const { snapshotMix, registerPlayerSituation } = useContext(Context);

  const [filterValue, setFilterValue] = useState(1800);
  const [volValue, setVolValue] = useState(1.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isStereo, setIsStereo] = useState(false);
  const audioCtxRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const noiseSourceRef = useRef(null);
  const gainNodeRef = useRef(null);
  const filterRef = useRef(null);
  const modulatorIntervalRef = useRef(null);
  const stereoNodesRef = useRef(null);

  // FILTER ----------------------------------------
  const handleFilterValue = e => {
    const value = parseFloat(e.currentTarget.value);
    setFilterValue(value);
    registerPlayerSituation('whiteNoise', { filter: value });
    if (filterRef.current && audioCtxRef.current) {
      filterRef.current.frequency.setTargetAtTime(
        value,
        audioCtxRef.current.currentTime,
        0.01
      );
    }
  };

  // VOLUME ----------------------------------------
  const handleVolValue = e => {
    const value = parseFloat(e.currentTarget.value) / 100;
    setVolValue(value);
    registerPlayerSituation('whiteNoise', { volume: value });

    if (custom === 'perlinNoise' && isPlaying) {
      if (value === 0) {
        soundTools.perlinNoise.stopPerlinModulation(modulatorIntervalRef);
        if (gainNodeRef.current && audioCtxRef.current) {
          gainNodeRef.current.gain.setTargetAtTime(
            0,
            audioCtxRef.current.currentTime,
            0.01
          );
        }
      } else {
        soundTools.perlinNoise.startPerlinModulation(
          0.5,
          value,
          gainNodeRef,
          audioCtxRef,
          modulatorIntervalRef
        );
      }
    } else {
      if (gainNodeRef.current && audioCtxRef.current) {
        gainNodeRef.current.gain.setTargetAtTime(
          value,
          audioCtxRef.current.currentTime,
          0.01
        );
      }
    }
  };

  // PLAY ----------------------------------------
  async function play(event, custom) {
    if (isPlaying && event.target.dataset.stop) {
      setIsPlaying(false);
      registerPlayerSituation('whiteNoise', { isPlaying: false });

      stop();
      return;
    }
    if (isPlaying) {
      return;
    }
    setIsPlaying(true);
    registerPlayerSituation('whiteNoise', { isPlaying: true });

    if (audioCtxRef.current) return;

    const { gainNode, audioCtx, noiseSource } =
      soundTools.noise.createWhiteNoise(audioCtxRef, noiseSourceRef);

    gainNode.gain.setValueAtTime(volValue, audioCtx.currentTime);
    gainNodeRef.current = gainNode;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterValue, audioCtx.currentTime);
    filterRef.current = filter;

    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    noiseSource.connect(filter);
    noiseSource.start();

    if (custom === 'perlinNoise') {
      soundTools.perlinNoise.startPerlinModulation(
        0.5,
        volValue,
        gainNodeRef,
        audioCtxRef,
        modulatorIntervalRef
      );
    }
  }

  // STOP -------------------------------------------------
  function stop() {
    setIsPlaying(false);
    setIsStereo(false);
    if (noiseSourceRef.current) {
      noiseSourceRef.current.stop();
      noiseSourceRef.current.disconnect();
      noiseSourceRef.current = null;
    }
    if (filterRef.current) {
      filterRef.current.disconnect();
      filterRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
    if (modulatorIntervalRef.current) {
      clearInterval(modulatorIntervalRef.current);
      modulatorIntervalRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }

  // STEREO ------------------------------------------------
  function toggleStereoEffect() {
    const audioCtx = audioCtxRef.current;
    const filter = filterRef.current;
    const gainNode = gainNodeRef.current;

    if (!audioCtx || !filter || !gainNode) return;

    if (isStereo) {
      // Disable stereo
      const { merger } = stereoNodesRef.current;

      filter.disconnect();
      merger.disconnect();

      // Reconnect filter directly to gainNode
      filter.connect(gainNode);

      setIsStereo(false);
      stereoNodesRef.current = null;
    } else {
      // Enable stereo
      filter.disconnect();

      const stereoNodes = applyStereoDelayRight(audioCtx, filter);
      stereoNodesRef.current = stereoNodes;

      stereoNodes.merger.connect(gainNode);

      setIsStereo(true);
    }
  }

  function applyStereoDelayRight(audioCtx, sourceNode) {
    const splitter = audioCtx.createChannelSplitter(2);
    const delayRight = audioCtx.createDelay();
    delayRight.delayTime.setValueAtTime(0.025, audioCtx.currentTime); // 25ms delay

    const merger = audioCtx.createChannelMerger(2);

    // Connexions :
    sourceNode.connect(splitter);

    // Gauche (direct)
    splitter.connect(merger, 0, 0); // out channel 0 → in channel 0

    // Droite (delay)
    splitter.connect(delayRight, 0); // out channel 0 → delay
    delayRight.connect(merger, 0, 1); // delay output → in channel 1

    return { splitter, delayRight, merger };
  }

  return (
    <div
      data-stop={true}
      className={
        isPlaying
          ? ' player-container is-playing playing expand'
          : 'player-container'
      }
      onClick={event => play(event, custom)}
    >
      <h3 className={isPlaying ? 'playing' : ''}>
        <i
          className={
            isPlaying
              ? 'fa-solid fa-ear-listen title playing'
              : 'fa-solid fa-ear-listen title'
          }
        ></i>
      </h3>
      {isPlaying && (
        <div className="main-container">
          {isPlaying && (
            <div className="sliders-container">
              <div className="sliders-labels">
                <span>
                  <i
                    className={
                      isPlaying
                        ? 'fa-solid fa-filter playing'
                        : 'fa-solid fa-filter'
                    }
                  ></i>
                </span>
                <span>
                  <i
                    className={
                      isPlaying
                        ? 'fa-solid fa-volume-high playing'
                        : 'fa-solid fa-volume-high'
                    }
                  ></i>
                </span>
              </div>
              <div className="sliders">
                <input
                  className="noise-range"
                  type="range"
                  min="50"
                  max="1500"
                  step="10"
                  onChange={handleFilterValue}
                  value={filterValue}
                />
                <input
                  className="vol-range"
                  type="range"
                  min="0"
                  max="150"
                  step="1"
                  value={volValue * 100}
                  onChange={handleVolValue}
                />
              </div>
            </div>
          )}

          <div className="btn-container">
            {isPlaying && (
              <>
                <button onClick={stop} data-stop={true}>
                  <i className="fa-solid fa-pause playing" data-stop={true}></i>
                </button>
                <button onClick={toggleStereoEffect}>
                  <i
                    className={`fa-solid ${
                      isStereo ? 'fa-check-double' : 'fa-check'
                    } playing`}
                  ></i>
                </button>
                {custom == true && (
                  <button onClick={refresh}>
                    <i className="fa-solid fa-arrows-rotate playing"></i>{' '}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default WhiteNoisePlayer;
