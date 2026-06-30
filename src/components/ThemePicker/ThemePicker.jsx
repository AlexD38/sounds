import { useContext, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Context } from '../../context/context';
import { themes } from '../../ref/themes';
import './styles.css';

export function ThemePicker() {
  const { theme, setTheme } = useContext(Context);
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

  const selectTheme = themeId => {
    setTheme(themeId);
    setIsOpen(false);
  };

  const sheet =
    isOpen &&
    createPortal(
      <div
        className="theme-overlay"
        onClick={() => setIsOpen(false)}
        role="presentation"
      >
        <div
          className="theme-sheet"
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="theme-sheet-title"
        >
          <div className="theme-sheet__header">
            <h2 id="theme-sheet-title" className="theme-sheet__title">
              Color theme
            </h2>
            <button
              type="button"
              className="theme-sheet__close"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>
          <p className="theme-sheet__subtitle">
            Pick a cozy palette. Your choice is saved automatically.
          </p>
          <div className="theme-grid">
            {themes.map(item => {
              const isActive = theme === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`theme-card${isActive ? ' theme-card--active' : ''}`}
                  onClick={() => selectTheme(item.id)}
                  aria-pressed={isActive}
                >
                  <span className="theme-card__swatches" aria-hidden="true">
                    {item.swatch.map(color => (
                      <span
                        key={color}
                        className="theme-card__swatch"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </span>
                  <span className="theme-card__label">{item.label}</span>
                  <span className="theme-card__desc">{item.description}</span>
                  {isActive && (
                    <span className="theme-card__check" aria-hidden="true">
                      <i className="fa-solid fa-check" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <button
        type="button"
        className="theme-picker-trigger"
        onClick={() => setIsOpen(true)}
        aria-label="Change color theme"
        aria-expanded={isOpen}
        title="Change theme"
      >
        <i className="fa-solid fa-palette" aria-hidden="true" />
      </button>
      {sheet}
    </>
  );
}
