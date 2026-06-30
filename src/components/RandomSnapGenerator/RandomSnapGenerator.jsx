import { useContext } from 'react';
import { Context } from '../../context/context';
import { config } from '../../ref/random.config';

export const RandomSnapGenerator = () => {
  const {
    setStopAll,
    setPlayingSnap,
    setLoadASnap,
    setNotification,
    setRandomSnap,
  } = useContext(Context);

  const generateRandomSnap = () => {
    setStopAll(true);
    const numberOfPlayersArr = [2, 2, 3, 4];
    const randomSnapTitle = [];
    const selectedPlayers = { players: [] };

    const numberOfPlayersNeeded =
      numberOfPlayersArr[Math.floor(Math.random() * numberOfPlayersArr.length)];

    const availableIndexes = Array.from({ length: config.length }, (_, i) => i);

    for (
      let i = 0;
      i < numberOfPlayersNeeded && availableIndexes.length > 0;
      i++
    ) {
      const randomIdxInAvailable = Math.floor(
        Math.random() * availableIndexes.length
      );
      const playerIndex = availableIndexes.splice(randomIdxInAvailable, 1)[0];
      const targetedPlayer = config[playerIndex];

      selectedPlayers.players.push({
        playerTitle: targetedPlayer.title,
        isPlaying: true,
      });

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

    setRandomSnap(result);
    setLoadASnap(true);
    setPlayingSnap(finalTitle);
    setNotification({
      message: `Now Playing auto generated playlist`,
    });
    setStopAll(false);

    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  return (
    <button
      type="button"
      className="bar-action"
      onClick={generateRandomSnap}
      aria-label="Generate random mix"
    >
      <i className="fa-solid fa-dice" aria-hidden="true" />
      <span className="bar-action__label">Random</span>
    </button>
  );
};
