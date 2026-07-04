import { useContext, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Context } from '../../context/context';
import { SavedSnapsList } from '../SavedSnaps/SavedSnapsList';
import './styles.css';

export function MixesSheet() {
  const { savedSnaps, mixesSheetOpen, setMixesSheetOpen } = useContext(Context);
  const closeButtonRef = useRef(null);

  const snapCount =
    savedSnaps instanceof Map
      ? savedSnaps.size
      : new Map(savedSnaps ?? []).size;

  useEffect(() => {
    if (!mixesSheetOpen) return;

    const handleKeyDown = event => {
      if (event.key === 'Escape') setMixesSheetOpen(false);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [mixesSheetOpen, setMixesSheetOpen]);

  const sheet =
    mixesSheetOpen &&
    createPortal(
      <div
        className="mixes-overlay"
        onClick={() => setMixesSheetOpen(false)}
        role="presentation"
      >
        <div
          className="mixes-sheet"
          onClick={event => event.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mixes-sheet-title"
        >
          <div className="mixes-sheet__header">
            <div>
              <h2 id="mixes-sheet-title" className="mixes-sheet__title">
                Your mixes
              </h2>
              <p className="mixes-sheet__subtitle">
                Load a saved soundscape or remove ones you no longer need.
              </p>
            </div>
            <div className="mixes-sheet__header-actions">
              {snapCount > 0 && (
                <span className="mixes-sheet__count">{snapCount}</span>
              )}
              <button
                ref={closeButtonRef}
                type="button"
                className="mixes-sheet__close"
                onClick={() => setMixesSheetOpen(false)}
                aria-label="Close mixes"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
          </div>
          <SavedSnapsList onLoad={() => setMixesSheetOpen(false)} />
        </div>
      </div>,
      document.body
    );

  return sheet;
}

export function MixesSheetTrigger() {
  const { savedSnaps, setMixesSheetOpen } = useContext(Context);

  const snapCount =
    savedSnaps instanceof Map
      ? savedSnaps.size
      : new Map(savedSnaps ?? []).size;

  return (
    <div className="bar-action-wrapper">
      <button
        type="button"
        className="bar-action"
        onClick={() => setMixesSheetOpen(true)}
        aria-label={`Mixes${snapCount > 0 ? `, ${snapCount} saved` : ''}`}
      >
        <i className="fa-solid fa-bookmark" aria-hidden="true" />
        <span className="bar-action__label">Mixes</span>
        {snapCount > 0 && (
          <span className="bar-action__badge" aria-hidden="true">
            {snapCount}
          </span>
        )}
      </button>
    </div>
  );
}
