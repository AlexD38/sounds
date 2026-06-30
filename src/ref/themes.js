export const THEME_STORAGE_KEY = 'ambient-architect-theme';
export const DEFAULT_THEME_ID = 'forest';

export const themes = [
  {
    id: 'forest',
    label: 'Forest',
    description: 'Deep greens and warm sand.',
    swatch: ['#1a2423', '#7eb8a4', '#faeab1'],
    metaColor: '#1a2423',
  },
  {
    id: 'ember',
    label: 'Ember',
    description: 'Charcoal warmth with copper glow.',
    swatch: ['#1c1612', '#d4956a', '#f5e6c8'],
    metaColor: '#1c1612',
  },
  {
    id: 'ocean',
    label: 'Ocean',
    description: 'Midnight navy and soft teal.',
    swatch: ['#0f1a24', '#5eb8c9', '#c8e8f5'],
    metaColor: '#0f1a24',
  },
  {
    id: 'lavender',
    label: 'Lavender',
    description: 'Dusky violet and soft lilac.',
    swatch: ['#1a1724', '#a88cc8', '#e8d8f0'],
    metaColor: '#1a1724',
  },
  {
    id: 'rose',
    label: 'Rose',
    description: 'Wine tones and dusty blush.',
    swatch: ['#24181c', '#c87a8a', '#f5e0d8'],
    metaColor: '#24181c',
  },
  {
    id: 'midnight',
    label: 'Midnight',
    description: 'Blue-black with periwinkle light.',
    swatch: ['#12141f', '#7a8cc8', '#d8e0f5'],
    metaColor: '#12141f',
  },
];

export const THEME_IDS = themes.map(theme => theme.id);

export function getStoredTheme() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && THEME_IDS.includes(saved)) return saved;
  } catch {
    // localStorage may be unavailable
  }
  return DEFAULT_THEME_ID;
}

export function getThemeById(id) {
  return themes.find(theme => theme.id === id) ?? themes[0];
}
