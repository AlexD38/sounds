import { config } from '../ref/random.config';
import { hasFreesoundApiKey } from '../ref/localMusic';
import { randomWindParams } from '../ref/windPresets';
import { isWindCreator } from './windCreator';

function pickVolume() {
  return 0.55 + Math.random() * 0.9;
}

function pickFilter() {
  return 700 + Math.floor(Math.random() * 1400);
}

function pickSpeed(supportsSpeed) {
  if (!supportsSpeed) return undefined;
  return 0.75 + Math.random() * 0.5;
}

/**
 * Build and apply a random mix via loadMix / setNotification from context.
 */
export function generateRandomMix({ loadMix, setNotification }) {
  const numberOfPlayersArr = [2, 2, 3, 4];
  const randomSnapTitle = [];
  const selectedPlayers = { players: [] };

  const numberOfPlayersNeeded =
    numberOfPlayersArr[Math.floor(Math.random() * numberOfPlayersArr.length)];

  const pool = config.filter(player => {
    if (player.title === 'music') return hasFreesoundApiKey();
    return true;
  });

  const availableIndexes = Array.from({ length: pool.length }, (_, i) => i);

  for (
    let i = 0;
    i < numberOfPlayersNeeded && availableIndexes.length > 0;
    i++
  ) {
    const randomIdxInAvailable = Math.floor(
      Math.random() * availableIndexes.length
    );
    const playerIndex = availableIndexes.splice(randomIdxInAvailable, 1)[0];
    const targetedPlayer = pool[playerIndex];

    const entry = {
      playerTitle: targetedPlayer.title,
      isPlaying: true,
      volume: pickVolume(),
      filter: isWindCreator(targetedPlayer.title) ? 900 : pickFilter(),
    };

    const speed = pickSpeed(targetedPlayer.speed);
    if (speed != null) entry.speed = speed;

    if (isWindCreator(targetedPlayer.title)) {
      entry.windParams = randomWindParams();
    }

    selectedPlayers.players.push(entry);

    randomSnapTitle.push(
      targetedPlayer.titleSuggestions[
        Math.floor(Math.random() * targetedPlayer.titleSuggestions.length)
      ]
    );
  }

  const adjectives = [];
  let noun = '';

  for (const word of randomSnapTitle) {
    if (word.endsWith('y') || word.endsWith('ing')) {
      adjectives.push(word);
    } else {
      noun = word;
    }
  }

  if (!noun && randomSnapTitle.length > 0) {
    noun = randomSnapTitle[randomSnapTitle.length - 1];
    adjectives.pop();
  }

  const finalTitle = [...adjectives, noun].join(' ');

  const result = new Map();
  result.set(finalTitle, selectedPlayers);

  loadMix({
    label: finalTitle,
    snapMap: result,
    activeMix: { type: 'random', label: finalTitle },
  });

  setNotification({
    message: `Now playing a random mix`,
  });

  setTimeout(() => {
    setNotification(null);
  }, 3000);

  return finalTitle;
}
