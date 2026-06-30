import { useContext } from 'react';
import { Context } from '../../context/context';
import { config } from '../../ref/random.config';
import './styles.css'; // Import local styles

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

    // Nombre de joueurs à sélectionner
    const numberOfPlayersNeeded =
      numberOfPlayersArr[Math.floor(Math.random() * numberOfPlayersArr.length)];

    // Pour éviter de sélectionner plusieurs fois le même joueur
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

    // ---- TRANSFORMATION EN PHRASE NATURELLE ----
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

    // ✅ Création de la Map comme demandé
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
    <div className="random-snap-gen">
      <i className="fa-solid fa-dice" onClick={generateRandomSnap}></i>
    </div>
  );
};
