import { calmWindParams, breezeWindParams } from './windPresets';

export const moodPresets = [
  {
    id: 'focus',
    label: 'Focus',
    icon: 'brain',
    description: 'Rain and soft white noise for deep concentration.',
    players: [
      { playerTitle: 'lightRain', isPlaying: true, volume: 1.1, filter: 1100 },
      { playerTitle: 'whiteNoise', isPlaying: true, volume: 0.55, filter: 2000 },
    ],
  },
  {
    id: 'sleep',
    label: 'Sleep',
    icon: 'moon',
    description: 'Night ambience with gentle rain to drift off.',
    players: [
      { playerTitle: 'night', isPlaying: true, volume: 1.0, filter: 700 },
      { playerTitle: 'heavyRain', isPlaying: true, volume: 0.75, filter: 900 },
      { playerTitle: 'whiteNoise', isPlaying: true, volume: 0.35, filter: 1800 },
    ],
  },
  {
    id: 'cozy',
    label: 'Cozy',
    icon: 'fire',
    description: 'Crackling fire and a warm home atmosphere.',
    players: [
      { playerTitle: 'fire', isPlaying: true, volume: 1.2, filter: 1300 },
      { playerTitle: 'home', isPlaying: true, volume: 0.9, filter: 1600 },
    ],
  },
  {
    id: 'voyage',
    label: 'Voyage',
    icon: 'train',
    description: 'Train rhythm with distant rain on the window.',
    players: [
      {
        playerTitle: 'train',
        isPlaying: true,
        volume: 1.0,
        filter: 1000,
        speed: 0.9,
      },
      { playerTitle: 'lightRain', isPlaying: true, volume: 0.65, filter: 950 },
    ],
  },
  {
    id: 'forest',
    label: 'Forest',
    icon: 'tree',
    description: 'Morning birds, forest air and a light breeze.',
    players: [
      { playerTitle: 'forest', isPlaying: true, volume: 1.1, filter: 1400 },
      { playerTitle: 'morning', isPlaying: true, volume: 0.85, filter: 1200 },
      {
        playerTitle: 'windCreator',
        isPlaying: true,
        volume: 0.45,
        filter: 1100,
        windParams: calmWindParams(),
      },
    ],
  },
  {
    id: 'city-rain',
    label: 'City Rain',
    icon: 'city',
    description: 'Urban streets under a rainy sky.',
    players: [
      { playerTitle: 'city', isPlaying: true, volume: 0.85, filter: 1300 },
      { playerTitle: 'heavyRain', isPlaying: true, volume: 0.7, filter: 850 },
      { playerTitle: 'thunder', isPlaying: true, volume: 0.35, filter: 600 },
    ],
  },
  {
    id: 'shore',
    label: 'Shore',
    icon: 'water',
    description: 'Gentle waves and open coastal air.',
    players: [
      {
        playerTitle: 'ocean',
        isPlaying: true,
        volume: 1.0,
        filter: 1200,
        speed: 0.85,
      },
      {
        playerTitle: 'lake',
        isPlaying: true,
        volume: 0.5,
        filter: 1400,
        speed: 0.9,
      },
      {
        playerTitle: 'windCreator',
        isPlaying: true,
        volume: 0.3,
        filter: 1000,
        windParams: breezeWindParams(),
      },
    ],
  },
  {
    id: 'study',
    label: 'Study',
    icon: 'book-open',
    description: 'Quiet pages, soft rain on the window.',
    players: [
      { playerTitle: 'book', isPlaying: true, volume: 0.9, filter: 1500 },
      { playerTitle: 'writing', isPlaying: true, volume: 0.55, filter: 1600 },
      { playerTitle: 'lightRain', isPlaying: true, volume: 0.45, filter: 1100 },
    ],
  },
];

export const getMoodPresetById = id =>
  moodPresets.find(mood => mood.id === id);

export const getMoodPresetByLabel = label =>
  moodPresets.find(mood => mood.label === label);
