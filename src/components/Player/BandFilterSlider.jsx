/** Shared Hz scale for the dual-thumb band filter (HP left, LP right). */
export const BAND_FILTER_MIN = 20;
export const BAND_FILTER_MAX = 8000;
export const BAND_FILTER_STEP = 10;
export const BAND_FILTER_GAP = 50;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * One track, two thumbs: low = high-pass, high = low-pass.
 */
export function BandFilterSlider({
  low,
  high,
  onLowChange,
  onHighChange,
  min = BAND_FILTER_MIN,
  max = BAND_FILTER_MAX,
  step = BAND_FILTER_STEP,
  gap = BAND_FILTER_GAP,
  disabled = false,
}) {
  const lowSafe = clamp(low, min, max - gap);
  const highSafe = clamp(high, lowSafe + gap, max);
  const lowPct = ((lowSafe - min) / (max - min)) * 100;
  const highPct = ((highSafe - min) / (max - min)) * 100;

  const handleLow = e => {
    const next = clamp(parseFloat(e.target.value), min, highSafe - gap);
    onLowChange(next);
  };

  const handleHigh = e => {
    const next = clamp(parseFloat(e.target.value), lowSafe + gap, max);
    onHighChange(next);
  };

  return (
    <div
      className={`band-filter-slider${disabled ? ' is-disabled' : ''}`}
      style={{
        '--band-low': `${lowPct}%`,
        '--band-high': `${highPct}%`,
      }}
    >
      <div className="band-filter-slider__rail" aria-hidden="true" />
      <input
        className="band-filter-slider__thumb band-filter-slider__thumb--low"
        type="range"
        min={min}
        max={max}
        step={step}
        value={lowSafe}
        disabled={disabled}
        onChange={handleLow}
        aria-label="High-pass filter"
      />
      <input
        className="band-filter-slider__thumb band-filter-slider__thumb--high"
        type="range"
        min={min}
        max={max}
        step={step}
        value={highSafe}
        disabled={disabled}
        onChange={handleHigh}
        aria-label="Low-pass filter"
      />
    </div>
  );
}
