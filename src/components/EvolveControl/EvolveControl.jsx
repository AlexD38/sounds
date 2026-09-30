import { useContext, useEffect, useRef, useState } from 'react';
import { Context } from '../../context/context';
import {
  EVOLVE_INTERVAL_PRESETS,
  formatEvolveInterval,
} from '../../utils/evolveMix';
import './styles.css';

const INTERVAL_OPTIONS = [
  { value: 'auto', label: '20–60s', hint: 'Random each step' },
  ...EVOLVE_INTERVAL_PRESETS.map(sec => ({
    value: sec,
    label: `${sec}s`,
    hint: `Fixed every ${sec}s`,
  })),
];

export function EvolveControl() {
  const {
    snapshotMix,
    evolveEnabled,
    setEvolveEnabled,
    evolveIntervalSec,
    setEvolveIntervalSec,
  } = useContext(Context);
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapperRef = useRef(null);

  const hasPlaying = Array.from(snapshotMix.values()).some(p => p?.isPlaying);
  const canUse = hasPlaying || evolveEnabled;

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointer = e => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    const handleKey = e => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('pointerdown', handlePointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handlePointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!evolveEnabled) setMenuOpen(false);
  }, [evolveEnabled]);

  const toggle = () => {
    if (!canUse) return;
    setEvolveEnabled(!evolveEnabled);
  };

  const currentValue =
    evolveIntervalSec === 'auto' || evolveIntervalSec == null
      ? 'auto'
      : evolveIntervalSec;

  return (
    <div className="bar-action-wrapper evolve-control" ref={wrapperRef}>
      <button
        type="button"
        className={`bar-action${evolveEnabled ? ' bar-action--active' : ''}${
          !canUse ? ' bar-action--disabled' : ''
        }`}
        onClick={toggle}
        disabled={!canUse}
        aria-pressed={evolveEnabled}
        aria-label={
          evolveEnabled
            ? `Evolve on, ${formatEvolveInterval(evolveIntervalSec)}. Tap to stop.`
            : 'Evolve mix'
        }
      >
        <i className="fa-solid fa-seedling" aria-hidden="true" />
        <span className="bar-action__label">Evolve</span>
      </button>

      {evolveEnabled && (
        <button
          type="button"
          className="evolve-control__badge"
          onClick={() => setMenuOpen(open => !open)}
          aria-label="Change evolve interval"
          aria-expanded={menuOpen}
          aria-haspopup="listbox"
        >
          {currentValue === 'auto' ? 'auto' : `${currentValue}s`}
          <i className="fa-solid fa-chevron-up" aria-hidden="true" />
        </button>
      )}

      {menuOpen && evolveEnabled && (
        <div
          className="evolve-menu"
          role="listbox"
          aria-label="Evolve interval"
        >
          <p className="evolve-menu__title">Interval</p>
          {INTERVAL_OPTIONS.map(opt => {
            const selected = opt.value === currentValue;
            return (
              <button
                key={String(opt.value)}
                type="button"
                role="option"
                aria-selected={selected}
                className={`evolve-menu__option${
                  selected ? ' evolve-menu__option--selected' : ''
                }`}
                onClick={() => {
                  setEvolveIntervalSec(opt.value);
                  setMenuOpen(false);
                }}
              >
                <span className="evolve-menu__option-label">{opt.label}</span>
                <span className="evolve-menu__option-hint">{opt.hint}</span>
                {selected && (
                  <i
                    className="fa-solid fa-check evolve-menu__check"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
