import React, { useState, useRef, useEffect } from 'react';
import './style.css';
export default function Slider({ min = 0, max = 100, height = 200 }) {
  const [value, setValue] = useState((max + min) / 2);
  const sliderRef = useRef(null);
  const isDragging = useRef(false);

  const handleMouseDown = e => {
    isDragging.current = true;
    updateValue(e);
  };

  const handleMouseMove = e => {
    if (isDragging.current) {
      updateValue(e);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const updateValue = e => {
    const slider = sliderRef.current;
    const rect = slider.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percentage = 1 - y / rect.height;
    const newValue = Math.round(min + percentage * (max - min));
    setValue(Math.max(min, Math.min(max, newValue)));
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const thumbPosition = ((max - value) / (max - min)) * height;

  return (
    <div
      className="slider-container"
      style={{ height: `${height}px` }}
      ref={sliderRef}
      onMouseDown={handleMouseDown}
    >
      <div className="slider-track" />
      <div className="slider-thumb" style={{ top: `${thumbPosition}px` }} />
      <div className="slider-value">{value}</div>
    </div>
  );
}
