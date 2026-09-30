import { moodPresets } from '../ref/mood.presets';
import { getDayPeriod } from './dayPeriod';

function hashDateKey(key) {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return h;
}

function todayKey(date = new Date()) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

export function getMoodOfTheDay(date = new Date()) {
  if (!moodPresets.length) return null;
  const idx = hashDateKey(todayKey(date)) % moodPresets.length;
  return moodPresets[idx];
}

const PERIOD_HINTS = {
  morning: 'A clear start — lean into focus or soft daylight textures.',
  day: 'Keep the room steady while you work.',
  evening: 'Wind down without going fully dark yet.',
  night: 'Let the mix stay low and unhurried.',
};

export function getMoodOfDayHint(mood, period = getDayPeriod()) {
  const periodHint = PERIOD_HINTS[period] || PERIOD_HINTS.day;
  if (!mood) return periodHint;
  return `${periodHint} Today’s pick: ${mood.description}`;
}
