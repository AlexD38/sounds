export const PlayerTitle = ({ title, isPlaying }) => {
  let iconLabel = 'question';
  if (title === 'morning') {
    iconLabel = 'dove';
  } else if (title === 'birdWoods') {
    iconLabel = 'tree';
  } else if (title === 'fire') {
    iconLabel = 'fire';
  } else if (title === 'village') {
    iconLabel = 'house';
  } else if (title === 'spring') {
    iconLabel = 'seedling';
  } else if (title === 'ocean') {
    iconLabel = 'house-tsunami';
  } else if (title === 'lake') {
    iconLabel = 'water';
  } else if (title === 'lightRain') {
    iconLabel = 'umbrella';
  } else if (title === 'heavyRain') {
    iconLabel = 'cloud-rain';
  } else if (title === 'thunder') {
    iconLabel = 'cloud-bolt';
  } else if (title === 'train') {
    iconLabel = 'train';
  } else if (title === 'night') {
    iconLabel = 'moon';
  } else if (title === 'scary') {
    iconLabel = 'ghost';
  } else if (title === 'chatter') {
    iconLabel = 'comments';
  } else if (title === 'crow') {
    iconLabel = 'crow';
  } else if (title === 'music') {
    iconLabel = 'music';
  } else if (title === 'book') {
    iconLabel = 'book';
  } else if (title == 'writing') {
    iconLabel = 'feather-pointed';
  } else if (title == 'whiteNoise') {
    iconLabel = 'ear-listen';
  } else if (title == 'bowl') {
    iconLabel = 'bell';
  } else if (title == 'wind') {
    iconLabel = 'wind';
  } else if (title == 'cat') {
    iconLabel = 'paw';
  } else if (title == 'forest') {
    iconLabel = 'tree';
  } else if (title == 'home') {
    iconLabel = 'house-chimney';
  } else if (title == 'city') {
    iconLabel = 'city';
  } else {
    return title;
  }

  let iconClassName = `fa-solid fa-${iconLabel} title`;

  return (
    <i className={isPlaying ? iconClassName + ' playing' : iconClassName}></i>
  );
};
