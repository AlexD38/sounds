export const PlayerTitle = ({ title, isPlaying }) => {
  let iconLabel = 'question';
  if (title === 'morning') {
    iconLabel = 'dove';
  } else if (title === 'fire') {
    iconLabel = 'fire';
  } else if (title === 'village') {
    iconLabel = 'house';
  } else if (title === 'srping') {
    iconLabel = 'seedling';
  } else if (title === 'ocean') {
    iconLabel = 'water';
  } else if (title === 'lightRain') {
    iconLabel = 'cloud-rain';
  } else if (title === 'rain') {
    iconLabel = 'umbrella';
  } else if (title === 'thunder') {
    iconLabel = 'cloud-bolt';
  } else if (title === 'train') {
    iconLabel = 'train';
  } else if (title === 'night') {
    iconLabel = 'moon';
  } else if (title === 'scary') {
    iconLabel = 'hat-wizard';
  } else if (title === 'wolf') {
    iconLabel = 'ghost';
  } else {
    return title;
  }

  let iconClassName = `fa-solid fa-${iconLabel} title`;

  return (
    <i className={isPlaying ? iconClassName + ' playing' : iconClassName}></i>
  );
};
