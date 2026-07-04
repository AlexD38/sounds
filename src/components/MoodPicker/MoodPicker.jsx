import { useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Context } from '../../context/context';
import { moodPresets } from '../../ref/mood.presets';
import './styles.css';

export const MoodPicker = () => {
  const {
    loadMix,
    setNotification,
    activeMix,
  } = useContext(Context);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = e => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const loadMood = mood => {
    const snap = new Map();
    snap.set(mood.label, { title: mood.label, players: mood.players });

    loadMix({
      label: mood.label,
      snapMap: snap,
      activeMix: { type: 'mood', id: mood.id, label: mood.label },
    });

    setNotification({ message: `Now playing "${mood.label}" mood` });
    setTimeout(() => setNotification(null), 3000);

    setIsOpen(false);
  };

  const isMoodActive = mood =>
    activeMix?.type === 'mood' && activeMix?.id === mood.id;

  const sheet =
    isOpen &&
    createPortal(
      <div
        className="mood-overlay"
        onClick={() => setIsOpen(false)}
        role="presentation"
      >
        <div
          className="mood-sheet"
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="mood-sheet-title"
        >
          <div className="mood-sheet__header">
            <h2 id="mood-sheet-title" className="mood-sheet__title">
              Choose a mood
            </h2>
            <button
              type="button"
              className="mood-sheet__close"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>
          <p className="mood-sheet__subtitle">
            Curated soundscapes, ready in one tap.
          </p>
          <div className="mood-grid">
            {moodPresets.map(mood => (
              <button
                key={mood.id}
                type="button"
                className={`mood-card${isMoodActive(mood) ? ' mood-card--active' : ''}`}
                onClick={() => loadMood(mood)}
                aria-pressed={isMoodActive(mood)}
              >
                {isMoodActive(mood) && (
                  <span className="mood-card__active-dot" aria-hidden="true" />
                )}
                <span className="mood-card__icon-wrap">
                  <i
                    className={`fa-solid fa-${mood.icon}`}
                    aria-hidden="true"
                  />
                </span>
                <span className="mood-card__label">{mood.label}</span>
                <span className="mood-card__desc">{mood.description}</span>
              </button>
            ))}
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <button
        type="button"
        className={`bar-action${activeMix?.type === 'mood' ? ' bar-action--active' : ''}`}
        onClick={() => setIsOpen(true)}
        aria-label="Choose a mood"
        aria-expanded={isOpen}
      >
        <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" />
        <span className="bar-action__label">Moods</span>
      </button>
      {sheet}
    </>
  );
};
