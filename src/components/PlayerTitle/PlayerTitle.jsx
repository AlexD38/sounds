import { formatPlayerLabel } from '../../utils/formatPlayerLabel';
import { isWindCreator } from '../../utils/windCreator';

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
    iconLabel = 'water';
  } else if (title === 'lake') {
    iconLabel = 'water';
  } else if (title === 'lightRain') {
    iconLabel = 'cloud-rain';
  } else if (title === 'heavyRain') {
    iconLabel = 'cloud-showers-heavy';
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
    iconLabel = 'book-open';
  } else if (title === 'writing') {
    iconLabel = 'feather-pointed';
  } else if (title === 'whiteNoise') {
    iconLabel = 'wave-square';
  } else if (title === 'bowl') {
    iconLabel = 'bell';
  } else if (isWindCreator(title)) {
    iconLabel = 'wind';
  } else if (title === 'cat') {
    iconLabel = 'cat';
  } else if (title === 'forest') {
    iconLabel = 'tree';
  } else if (title === 'home') {
    iconLabel = 'house-chimney';
  } else if (title === 'city') {
    iconLabel = 'city';
  } else if (title === 'waves') {
    iconLabel = 'water';
  } else if (title === 'market') {
    iconLabel = 'store';
  } else {
    return (
      <span className="player-card__icon player-card__icon--text">
        {formatPlayerLabel(title).charAt(0)}
      </span>
    );
  }

  const iconClassName = `fa-solid fa-${iconLabel} player-card__icon${
    isPlaying ? ' player-card__icon--active' : ''
  }`;

  return <i className={iconClassName} aria-hidden="true" />;
};
