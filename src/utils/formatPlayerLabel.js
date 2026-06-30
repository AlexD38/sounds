export const formatPlayerLabel = title => {
  const labels = {
    whiteNoise: 'White Noise',
    lightRain: 'Light Rain',
    heavyRain: 'Heavy Rain',
    birdWoods: 'Bird Woods',
  };
  if (labels[title]) return labels[title];
  return title
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, s => s.toUpperCase())
    .trim();
};
