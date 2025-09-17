import React, { useState, useEffect, useRef } from 'react';
import PaulStretch from 'paulstretch';

export default function Stretcher({ source }) {
  const [status, setStatus] = useState('Idle');
  const [filterValue, setFilterValue] = useState(1500);
  const filterRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [filterFreq, setFilterFreq] = useState(500); // Initial frequency for the filter

  // Refs for Web Audio API objects
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const filterNodeRef = useRef(null);

  // Initialize AudioContext and PaulStretch instance
  const [ps] = useState(() => {
    const audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    audioContextRef.current = audioContext;

    const filter = audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    filterNodeRef.current = filter;

    // Connect filter to destination
    filter.connect(audioContext.destination);

    return new PaulStretch({
      stretchFactor: 25,
      windowSize: 4,
      // audioContext: audioContext,
    });
  });

  const handleFilterValue = e => {
    const value = parseFloat(e.currentTarget.value);
    setFilterValue(value);
    if (filterRef.current && audioCtxRef.current) {
      filterRef.current.frequency.setTargetAtTime(
        value,
        audioCtxRef.current.currentTime,
        0.1
      );
    }
  };
  // Effect for cleanup
  useEffect(() => {
    return () => {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch (e) {}
      }
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== 'closed'
      ) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Update filter frequency when state changes
  useEffect(() => {
    if (filterNodeRef.current) {
      filterNodeRef.current.frequency.setValueAtTime(
        filterFreq,
        audioContextRef.current.currentTime
      );
    }
  }, [filterFreq]);

  const handlePlay = async () => {
    if (!source) {
      setError('No audio source provided.');
      return;
    }

    try {
      // Ensure AudioContext is running
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      setStatus('Loading audio...');
      const audioBuffer = await ps.loadAudio(source);

      setStatus('Stretching...');
      const stretchedBuffer = await ps.stretch(audioBuffer, p => {
        setProgress(p);
      });
      console.log(stretchedBuffer);

      // Stop any existing source
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch (e) {}
      }

      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();

      const newSource = audioContext.createBufferSource();
      newSource.buffer = stretchedBuffer; // direct, pas de decode
      sourceNodeRef.current = newSource;
      newSource.connect(audioContext.destination);
      newSource.start();

      setStatus('Playing');
    } catch (e) {
      setError(e.message);
      console.error('[Stretcher] Failed to process audio:', e);
    }
  };

  const handleStop = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch (e) {
        console.error('Failed to stop audio source:', e);
      }
      sourceNodeRef.current = null;
    }
    setStatus('Idle');
    setProgress(0);
  };

  if (error) {
    return <div style={{ padding: 20, color: 'red' }}>Error: {error}</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h4>Stretched Player (paulstretch)</h4>
      {status === 'Idle' || status === 'Finished' ? (
        <button onClick={handlePlay}>Lancer le Stretch</button>
      ) : (
        <>
          <p>
            Status: {status}
            {status === 'Stretching...' && `(${Math.round(progress * 100)}%)`}
          </p>
          <button onClick={handleStop}>Stop</button>
        </>
      )}
      <div style={{ marginTop: 15 }}>
        <label htmlFor="filterFreq">Low-pass Freq: {filterValue} Hz</label>
        <input
          type="range"
          id="filterFreq"
          min="100"
          max="5000"
          step="10"
          value={filterValue}
          onChange={handleFilterValue}
          style={{ width: '100%' }}
        />
      </div>
    </div>
  );
}
