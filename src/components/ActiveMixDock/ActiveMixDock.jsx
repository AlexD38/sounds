import { useContext, useEffect, useMemo, useState } from 'react';
import { Context } from '../../context/context';
import { getMoodPresetById } from '../../ref/mood.presets';
import { formatPlayerLabel } from '../../utils/formatPlayerLabel';
import { formatEvolveInterval } from '../../utils/evolveMix';
import { PlayerTitle } from '../PlayerTitle/PlayerTitle';
import './styles.css';

const MIX_TYPE_LABELS = {
  mood: 'Mood',
  saved: 'Saved mix',
  random: 'Random mix',
  shared: 'Shared mix',
  weather: 'Weather',
};

const MIX_TYPE_ICONS = {
  mood: 'wand-magic-sparkles',
  saved: 'bookmark',
  random: 'dice',
  shared: 'link',
  weather: 'cloud-sun',
};

const DOCK_HINT_KEY = 'dock-hint-shown';

export function ActiveMixDock() {
  const {
    snapshotMix,
    activeMix,
    mixTransition,
    openScenesSheet,
    evolveEnabled,
    evolveIntervalSec,
  } = useContext(Context);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const playingEntries = useMemo(() => {
    const entries = [];
    for (const [title, player] of snapshotMix.entries()) {
      if (player.isPlaying) {
        entries.push({ title });
      }
    }
    return entries;
  }, [snapshotMix]);

  const playingCount = playingEntries.length;

  const moodPreset =
    activeMix?.type === 'mood' ? getMoodPresetById(activeMix.id) : null;
  const mixIcon = moodPreset?.icon ?? MIX_TYPE_ICONS[activeMix?.type] ?? null;
  const mixTypeLabel = activeMix ? MIX_TYPE_LABELS[activeMix.type] : null;

  useEffect(() => {
    if (playingCount === 0) {
      setIsExpanded(false);
      return;
    }

    if (!sessionStorage.getItem(DOCK_HINT_KEY)) {
      sessionStorage.setItem(DOCK_HINT_KEY, '1');
      setShowHint(true);
      const timer = setTimeout(() => setShowHint(false), 3200);
      return () => clearTimeout(timer);
    }
  }, [playingCount]);

  useEffect(() => {
    if (!isExpanded) return;

    const handleKeyDown = event => {
      if (event.key === 'Escape') setIsExpanded(false);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]);

  const showMixChip = Boolean(activeMix) && playingCount > 0;
  const contextClassName = `active-mix-dock__context${
    activeMix?.type === 'saved' ? ' active-mix-dock__context--clickable' : ''
  }${mixTransition ? ' active-mix-dock__context--transitioning' : ''}${
    evolveEnabled ? ' active-mix-dock__context--evolving' : ''
  }`;
  const contextContent = activeMix ? (
    <>
      {mixIcon && (
        <span className="active-mix-dock__context-icon" aria-hidden="true">
          <i className={`fa-solid fa-${mixIcon}`} />
        </span>
      )}
      <span className="active-mix-dock__context-text">
        <span className="active-mix-dock__context-type">
          {evolveEnabled
            ? `Evolving · ${formatEvolveInterval(evolveIntervalSec)}`
            : mixTypeLabel}
        </span>
        <span className="active-mix-dock__context-label">{activeMix.label}</span>
      </span>
      {(mixTransition || evolveEnabled) && (
        <span className="active-mix-dock__context-pulse" aria-hidden="true" />
      )}
    </>
  ) : null;

  return (
    <>
      {isExpanded && playingCount > 0 && (
        <div
          className="dock-sheet-overlay"
          onClick={() => setIsExpanded(false)}
          role="presentation"
        />
      )}

      <div
        className={`dock-portal-panel${isExpanded && playingCount > 0 ? ' dock-portal-panel--open' : ''}`}
        role="dialog"
        aria-modal={isExpanded}
        aria-labelledby="dock-sheet-title"
        aria-hidden={!isExpanded || playingCount === 0}
      >
        {isExpanded && playingCount > 0 && (
          <>
            <div className="dock-sheet__handle" aria-hidden="true" />
            <div className="dock-sheet__header">
              <div className="dock-sheet__heading">
                <h2 id="dock-sheet-title" className="dock-sheet__title">
                  Now playing
                </h2>
                <span className="dock-sheet__count">{playingCount}</span>
              </div>
              <button
                type="button"
                className="dock-sheet__close"
                onClick={() => setIsExpanded(false)}
                aria-label="Close now playing controls"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>
          </>
        )}
        <div id="active-mix-portal" className="active-mix-dock__cards" />
      </div>

      {showMixChip &&
        (activeMix.type === 'saved' ? (
          <button
            type="button"
            className={contextClassName}
            onClick={() => openScenesSheet('mixes')}
            aria-label={`Saved mix ${activeMix.label}. Open scenes.`}
          >
            {contextContent}
          </button>
        ) : (
          <span
            className={contextClassName}
            aria-label={`${mixTypeLabel}: ${activeMix.label}${
              evolveEnabled
                ? `, evolving ${formatEvolveInterval(evolveIntervalSec)}`
                : ''
            }`}
          >
            {contextContent}
          </span>
        ))}

      <aside
        className={`active-mix-dock${playingCount > 0 ? ' active-mix-dock--visible' : ''}${showHint ? ' active-mix-dock--hint' : ''}${isExpanded ? ' active-mix-dock--expanded' : ''}`}
        aria-label="Now playing"
        aria-hidden={playingCount === 0}
      >
        <div className="active-mix-dock__compact">
          <button
            type="button"
            className="active-mix-dock__expand"
            onClick={() => setIsExpanded(true)}
            aria-expanded={isExpanded}
            aria-controls="active-mix-portal"
            aria-label={`Now playing, ${playingCount} sound${playingCount === 1 ? '' : 's'}. Tap to expand controls.`}
          >
            <span className="active-mix-dock__chips">
              {playingEntries.map(entry => (
                <span key={entry.title} className="active-mix-dock__chip">
                  <span className="active-mix-dock__chip-icon" aria-hidden="true">
                    <PlayerTitle title={entry.title} isPlaying={true} />
                  </span>
                  <span className="active-mix-dock__chip-label">
                    {formatPlayerLabel(entry.title)}
                  </span>
                </span>
              ))}
            </span>

            <span className="active-mix-dock__meta">
              <span className="active-mix-dock__count">{playingCount}</span>
              <i
                className="fa-solid fa-chevron-up active-mix-dock__expand-icon"
                aria-hidden="true"
              />
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
