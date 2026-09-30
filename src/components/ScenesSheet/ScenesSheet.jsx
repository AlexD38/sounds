import { useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Context } from '../../context/context';
import { MoodGrid } from '../MoodPicker/MoodGrid';
import { SavedSnapsList } from '../SavedSnaps/SavedSnapsList';
import { buildShareUrl } from '../../utils/mixShare';
import '../MixesSheet/styles.css';
import '../MoodPicker/styles.css';
import './styles.css';

const SCENE_TABS = [
  { id: 'moods', label: 'Moods', icon: 'wand-magic-sparkles' },
  { id: 'mixes', label: 'My mixes', icon: 'bookmark' },
];

const TAB_ORDER = { moods: 0, mixes: 1 };

export function ScenesSheet() {
  const {
    savedSnaps,
    scenesSheetOpen,
    setScenesSheetOpen,
    scenesSheetTab,
    setScenesSheetTab,
    setNotification,
  } = useContext(Context);
  const closeButtonRef = useRef(null);
  const [tab, setTab] = useState(scenesSheetTab || 'moods');
  const [direction, setDirection] = useState('forward');

  const snapCount =
    savedSnaps instanceof Map
      ? savedSnaps.size
      : new Map(savedSnaps ?? []).size;

  useEffect(() => {
    if (!scenesSheetOpen) return;
    setTab(scenesSheetTab === 'mixes' ? 'mixes' : 'moods');
  }, [scenesSheetOpen, scenesSheetTab]);

  useEffect(() => {
    if (!scenesSheetOpen) return;

    const handleKeyDown = event => {
      if (event.key === 'Escape') setScenesSheetOpen(false);
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [scenesSheetOpen, setScenesSheetOpen]);

  const close = () => setScenesSheetOpen(false);

  const notify = (message, ms = 3000) => {
    setNotification({ message });
    setTimeout(() => setNotification(null), ms);
  };

  const selectTab = next => {
    if (next === tab) return;
    setDirection(TAB_ORDER[next] > TAB_ORDER[tab] ? 'forward' : 'back');
    setTab(next);
    setScenesSheetTab(next);
  };

  if (!scenesSheetOpen) return null;

  return createPortal(
    <div className="mixes-overlay" onClick={close} role="presentation">
      <div
        className="mixes-sheet scenes-sheet"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="scenes-sheet-title"
      >
        <div className="mixes-sheet__header">
          <div>
            <h2 id="scenes-sheet-title" className="mixes-sheet__title">
              Scenes
            </h2>
            <p className="mixes-sheet__subtitle">
              Moods and saved mixes.
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
              onClick={close}
              aria-label="Close scenes"
            >
              <i className="fa-solid fa-xmark" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          className="scenes-sheet__tabs"
          role="tablist"
          aria-label="Scene sections"
        >
          {SCENE_TABS.map(item => (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`scenes-tab-${item.id}`}
              aria-selected={tab === item.id}
              aria-controls="scenes-panel"
              className={`scenes-sheet__tab${tab === item.id ? ' scenes-sheet__tab--active' : ''}`}
              onClick={() => selectTab(item.id)}
            >
              <i className={`fa-solid fa-${item.icon}`} aria-hidden="true" />
              {item.label}
              {item.id === 'mixes' && snapCount > 0 && (
                <span className="scenes-sheet__tab-count">{snapCount}</span>
              )}
            </button>
          ))}
        </div>

        <div className="scenes-sheet__scroll">
          <div
            className={`scenes-sheet__panels scenes-sheet__panels--${direction}`}
          >
            <div
              key={tab}
              id="scenes-panel"
              role="tabpanel"
              aria-labelledby={`scenes-tab-${tab}`}
              className="scenes-sheet__panel"
            >
              {tab === 'moods' ? (
                <MoodGrid onSelect={close} />
              ) : (
                <SavedSnapsList
                  onLoad={close}
                  onShare={async snap => {
                    const url = buildShareUrl(snap);
                    try {
                      await navigator.clipboard.writeText(url);
                      notify(`Link for "${snap.title}" copied`);
                    } catch {
                      notify('Could not copy link');
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

const SCENE_ACTIVE_TYPES = new Set([
  'mood',
  'saved',
  'random',
  'shared',
  'weather',
]);

export function ScenesSheetTrigger() {
  const {
    savedSnaps,
    openScenesSheet,
    scenesSheetOpen,
    activeMix,
  } = useContext(Context);

  const snapCount =
    savedSnaps instanceof Map
      ? savedSnaps.size
      : new Map(savedSnaps ?? []).size;

  const isActive =
    scenesSheetOpen || SCENE_ACTIVE_TYPES.has(activeMix?.type);

  return (
    <div className="bar-action-wrapper">
      <button
        type="button"
        className={`bar-action${isActive ? ' bar-action--active' : ''}`}
        onClick={() => openScenesSheet('moods')}
        aria-label={`Scenes${snapCount > 0 ? `, ${snapCount} saved mixes` : ''}`}
        aria-expanded={scenesSheetOpen}
      >
        <i className="fa-solid fa-layer-group" aria-hidden="true" />
        <span className="bar-action__label">Scenes</span>
        {snapCount > 0 && (
          <span className="bar-action__badge" aria-hidden="true">
            {snapCount}
          </span>
        )}
      </button>
    </div>
  );
}
