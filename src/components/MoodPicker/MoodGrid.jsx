import { useContext, useState } from 'react';
import { Context } from '../../context/context';
import { moodPresets } from '../../ref/mood.presets';
import {
  getMoodOfDayHint,
  getMoodOfTheDay,
} from '../../utils/moodOfDay';
import { generateRandomMix } from '../../utils/generateRandomMix';
import {
  fetchWeatherSuggestion,
  loadMoodFromSuggestion,
} from '../../utils/weatherSuggest';
import './styles.css';

const SPECIAL_MOODS = [
  {
    id: 'random',
    icon: 'dice',
    label: 'Random',
    description: 'Surprise ambient blend.',
  },
  {
    id: 'weather',
    icon: 'cloud-sun',
    label: 'Weather',
    description: 'Match the sky outside.',
  },
];

export function MoodGrid({ onSelect }) {
  const { loadMix, setNotification, activeMix } = useContext(Context);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const moodOfDay = getMoodOfTheDay();
  const moodHint = getMoodOfDayHint(moodOfDay);

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
    onSelect?.(mood);
  };

  const loadRandom = () => {
    generateRandomMix({ loadMix, setNotification });
    onSelect?.({ id: 'random' });
  };

  const loadWeather = async () => {
    if (weatherLoading) return;
    setWeatherLoading(true);
    try {
      const suggestion = await fetchWeatherSuggestion();
      loadMoodFromSuggestion(suggestion, { loadMix, setNotification });
      onSelect?.({ id: 'weather' });
    } catch {
      setNotification({ message: 'Location unavailable' });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setWeatherLoading(false);
    }
  };

  const isMoodActive = mood =>
    activeMix?.type === 'mood' && activeMix?.id === mood.id;

  const isSpecialActive = id => {
    if (id === 'random') return activeMix?.type === 'random';
    if (id === 'weather') return activeMix?.type === 'weather';
    return false;
  };

  const handleSpecial = id => {
    if (id === 'random') loadRandom();
    else if (id === 'weather') loadWeather();
  };

  return (
    <div className="mood-grid-wrap">
      {moodOfDay && (
        <button
          type="button"
          className={`mood-card mood-card--featured${
            isMoodActive(moodOfDay) ? ' mood-card--active' : ''
          }`}
          onClick={() => loadMood(moodOfDay)}
          aria-pressed={isMoodActive(moodOfDay)}
        >
          <span className="mood-card__featured-badge">Today’s mood</span>
          {isMoodActive(moodOfDay) && (
            <span className="mood-card__active-dot" aria-hidden="true" />
          )}
          <span className="mood-card__icon-wrap">
            <i className={`fa-solid fa-${moodOfDay.icon}`} aria-hidden="true" />
          </span>
          <span className="mood-card__label">{moodOfDay.label}</span>
          <span className="mood-card__desc">{moodHint}</span>
        </button>
      )}

      <div className="mood-grid">
        {SPECIAL_MOODS.map(item => {
          const active = isSpecialActive(item.id);
          const busy = item.id === 'weather' && weatherLoading;
          return (
            <button
              key={item.id}
              type="button"
              className={`mood-card${active ? ' mood-card--active' : ''}${
                busy ? ' mood-card--busy' : ''
              }`}
              onClick={() => handleSpecial(item.id)}
              aria-pressed={active}
              disabled={busy}
            >
              {active && (
                <span className="mood-card__active-dot" aria-hidden="true" />
              )}
              <span className="mood-card__icon-wrap">
                <i
                  className={`fa-solid fa-${busy ? 'spinner' : item.icon}${
                    busy ? ' mood-card__spinner' : ''
                  }`}
                  aria-hidden="true"
                />
              </span>
              <span className="mood-card__label">
                {busy ? 'Checking…' : item.label}
              </span>
              <span className="mood-card__desc">{item.description}</span>
            </button>
          );
        })}
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
              <i className={`fa-solid fa-${mood.icon}`} aria-hidden="true" />
            </span>
            <span className="mood-card__label">{mood.label}</span>
            <span className="mood-card__desc">{mood.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
