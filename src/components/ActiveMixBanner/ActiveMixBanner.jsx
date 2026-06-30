import { useContext } from 'react';
import { Context } from '../../context/context';
import { getMoodPresetById } from '../../ref/mood.presets';
import './styles.css';

const MIX_TYPE_LABELS = {
  mood: 'Mood',
  saved: 'Saved mix',
  random: 'Random mix',
};

const MIX_TYPE_ICONS = {
  mood: 'wand-magic-sparkles',
  saved: 'bookmark',
  random: 'dice',
};

export function ActiveMixBanner() {
  const { activeMix, mixTransition } = useContext(Context);

  if (!activeMix) return null;

  const moodPreset =
    activeMix.type === 'mood' ? getMoodPresetById(activeMix.id) : null;
  const icon = moodPreset?.icon ?? MIX_TYPE_ICONS[activeMix.type] ?? 'music';
  const typeLabel = MIX_TYPE_LABELS[activeMix.type] ?? 'Mix';

  return (
    <div
      className={`active-mix-banner${mixTransition ? ' active-mix-banner--transitioning' : ''}`}
      role="status"
      aria-live="polite"
    >
      <span className="active-mix-banner__icon-wrap" aria-hidden="true">
        <i className={`fa-solid fa-${icon}`} />
      </span>
      <span className="active-mix-banner__text">
        <span className="active-mix-banner__type">{typeLabel}</span>
        <span className="active-mix-banner__label">{activeMix.label}</span>
      </span>
      {mixTransition && (
        <span className="active-mix-banner__pulse" aria-hidden="true" />
      )}
    </div>
  );
}
