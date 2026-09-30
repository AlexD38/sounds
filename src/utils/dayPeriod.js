const FALLBACK_MORNING = { startHour: 5, endHour: 11 };
const FALLBACK_EVENING = { startHour: 18, endHour: 23 };

const SUN_CACHE_KEY = 'aa-sun-times';

/** @returns {{ sunriseHour: number, sunsetHour: number } | null} */
export function readCachedSunTimes() {
  try {
    const raw = sessionStorage.getItem(SUN_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (
      typeof data?.sunriseHour !== 'number' ||
      typeof data?.sunsetHour !== 'number'
    ) {
      return null;
    }
    const today = new Date().toDateString();
    if (data.day !== today) return null;
    return data;
  } catch {
    return null;
  }
}

export function cacheSunTimes(sunriseIso, sunsetIso) {
  try {
    const sunrise = new Date(sunriseIso);
    const sunset = new Date(sunsetIso);
    if (Number.isNaN(sunrise.getTime()) || Number.isNaN(sunset.getTime())) {
      return;
    }
    sessionStorage.setItem(
      SUN_CACHE_KEY,
      JSON.stringify({
        day: new Date().toDateString(),
        sunriseHour: sunrise.getHours() + sunrise.getMinutes() / 60,
        sunsetHour: sunset.getHours() + sunset.getMinutes() / 60,
      })
    );
  } catch {
    // sessionStorage may be unavailable
  }
}

function hourNow(date = new Date()) {
  return date.getHours() + date.getMinutes() / 60;
}

/**
 * @returns {'morning' | 'day' | 'evening' | 'night'}
 */
export function getDayPeriod(date = new Date()) {
  const h = hourNow(date);
  const sun = readCachedSunTimes();

  if (sun) {
    const morningEnd = sun.sunriseHour + 4;
    const eveningStart = sun.sunsetHour - 1;
    if (h >= sun.sunriseHour && h < morningEnd) return 'morning';
    if (h >= eveningStart && h < sun.sunsetHour + 2) return 'evening';
    if (h >= sun.sunsetHour + 2 || h < sun.sunriseHour) return 'night';
    return 'day';
  }

  if (h >= FALLBACK_MORNING.startHour && h < FALLBACK_MORNING.endHour) {
    return 'morning';
  }
  if (h >= FALLBACK_EVENING.startHour && h < FALLBACK_EVENING.endHour) {
    return 'evening';
  }
  if (h >= FALLBACK_EVENING.endHour || h < FALLBACK_MORNING.startHour) {
    return 'night';
  }
  return 'day';
}
