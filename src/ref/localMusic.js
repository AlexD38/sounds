/** Local music library used when Freesound API is unavailable. */
export const LOCAL_MUSIC_TRACKS = [
  {
    id: 'chopin-local',
    title: 'Nocturne texture',
    author: 'Ambient Architect',
    url: '/assets/sounds/chopin.mp3',
  },
  {
    id: 'piano-local',
    title: 'Soft piano',
    author: 'Ambient Architect',
    url: '/assets/sounds/piano.mp3',
  },
];

export const hasFreesoundApiKey = () =>
  Boolean(import.meta.env.VITE_API_KEY && String(import.meta.env.VITE_API_KEY).trim());
