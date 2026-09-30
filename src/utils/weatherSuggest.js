import { getMoodPresetById } from '../ref/mood.presets';
import { cacheSunTimes } from './dayPeriod';

const WEATHER_CACHE_KEY = 'aa-weather-cache';
const CACHE_TTL_MS = 45 * 60 * 1000;

const WMO_LABELS = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Drizzle',
  55: 'Dense drizzle',
  61: 'Light rain',
  63: 'Rain',
  65: 'Heavy rain',
  71: 'Light snow',
  73: 'Snow',
  75: 'Heavy snow',
  80: 'Rain showers',
  81: 'Rain showers',
  82: 'Violent rain showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Thunderstorm with hail',
};

function mapWeatherToMood(code, isNight) {
  if ([95, 96, 99].includes(code)) {
    return { moodId: 'city-rain', label: 'Storm brewing' };
  }
  if ([61, 63, 65, 80, 81, 82, 51, 53, 55].includes(code)) {
    return {
      moodId: isNight ? 'sleep' : 'city-rain',
      label: isNight ? 'Rainy night' : 'Rainy streets',
    };
  }
  if ([71, 73, 75].includes(code)) {
    return { moodId: 'cozy', label: 'Snowy calm' };
  }
  if ([45, 48].includes(code)) {
    return { moodId: 'focus', label: 'Foggy focus' };
  }
  if ([0, 1].includes(code) && isNight) {
    return { moodId: 'sleep', label: 'Clear night' };
  }
  if ([0, 1, 2].includes(code)) {
    return { moodId: 'shore', label: 'Open air' };
  }
  // Overcast / default
  return { moodId: 'forest', label: 'Soft overcast' };
}

function readCache() {
  try {
    const raw = sessionStorage.getItem(WEATHER_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.fetchedAt || Date.now() - data.fetchedAt > CACHE_TTL_MS) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function writeCache(payload) {
  try {
    sessionStorage.setItem(
      WEATHER_CACHE_KEY,
      JSON.stringify({ ...payload, fetchedAt: Date.now() })
    );
  } catch {
    // ignore
  }
}

function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation unavailable'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: CACHE_TTL_MS,
    });
  });
}

/**
 * @returns {Promise<{
 *   conditionLabel: string,
 *   moodId: string,
 *   suggestionLabel: string,
 *   mood: object,
 * }>}
 */
export async function fetchWeatherSuggestion() {
  const cached = readCache();
  if (cached?.moodId) {
    const mood = getMoodPresetById(cached.moodId);
    if (mood) {
      return {
        conditionLabel: cached.conditionLabel,
        moodId: cached.moodId,
        suggestionLabel: cached.suggestionLabel,
        mood,
      };
    }
  }

  const pos = await getPosition();
  const { latitude, longitude } = pos.coords;

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('current', 'weather_code,is_day');
  url.searchParams.set('daily', 'sunrise,sunset');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', '1');

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Weather request failed');
  const json = await res.json();

  const code = Number(json?.current?.weather_code ?? 0);
  const isNight = Number(json?.current?.is_day) === 0;
  const sunrise = json?.daily?.sunrise?.[0];
  const sunset = json?.daily?.sunset?.[0];
  if (sunrise && sunset) cacheSunTimes(sunrise, sunset);

  const mapped = mapWeatherToMood(code, isNight);
  const mood = getMoodPresetById(mapped.moodId);
  if (!mood) throw new Error('No mood for weather');

  const conditionLabel = WMO_LABELS[code] || `Code ${code}`;
  const payload = {
    conditionLabel,
    moodId: mapped.moodId,
    suggestionLabel: mapped.label,
  };
  writeCache(payload);

  return { ...payload, mood };
}

export function loadMoodFromSuggestion(suggestion, { loadMix, setNotification }) {
  const mood = suggestion.mood;
  const snap = new Map();
  snap.set(mood.label, { title: mood.label, players: mood.players });
  loadMix({
    label: mood.label,
    snapMap: snap,
    activeMix: {
      type: 'weather',
      id: mood.id,
      label: suggestion.suggestionLabel || mood.label,
    },
  });
  setNotification({
    message: `${suggestion.conditionLabel} → ${suggestion.suggestionLabel}`,
  });
  setTimeout(() => setNotification(null), 4000);
}
