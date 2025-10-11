import { useContext, useEffect, useRef, useState } from 'react';
import './styles.css';
import { Context } from '../../context/context';

export const Timer = () => {
  const { setNotification, setStopAll } = useContext(Context);
  const [userInput, setUserInput] = useState(false);
  const minutesRef = useRef(null);
  const [countDown, setCountDown] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [stopCountDownBtn, setStopCountDownBtn] = useState(false);

  const handleLaunchTimer = () => {
    userInput ? setUserInput(false) : setUserInput(true);
  };

  const handleValidate = () => {
    const minutes = Number(minutesRef.current.value);
    setRemainingTime(minutes);

    setNotification({
      message: `Sounds will stop in ${minutes} minutes`,
    });
    setUserInput(false);

    setTimeout(() => setNotification(null), 3000);
    setCountDown(true);
  };

  useEffect(() => {
    if (countDown && remainingTime > 0) {
      const intervalId = setInterval(() => {
        setRemainingTime(prevTime => prevTime - 1);
      }, 1000);

      return () => clearInterval(intervalId);
    } else if (remainingTime === 0) {
      setCountDown(false);
      setStopAll(true);
      setNotification({ message: `Goodnight... and don't let the bugs bite` });
      setTimeout(() => setNotification(null), 3000);
      // 👉 ici tu mets l'action à exécuter quand ça s'arrête
    }
  }, [countDown, remainingTime]);

  const formatTime = time => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <>
      <div
        className="timer-container"
        onMouseEnter={() => setUserInput(true)}
        onMouseLeave={() => setUserInput(false)}
      >
        <i className="fa-solid fa-stopwatch" onClick={handleLaunchTimer}></i>
        {userInput && (
          <>
            <input
              className="timer-input"
              defaultValue={20}
              ref={minutesRef}
              type="number"
            ></input>
            <i
              className="fa-solid fa-check validate"
              onClick={handleValidate}
            ></i>
          </>
        )}
      </div>
      {countDown && (
        <div
          className="countdown"
          onMouseEnter={() => setStopCountDownBtn(true)}
          onMouseLeave={() => setStopCountDownBtn(false)}
        >
          <i className="fa-solid fa-stopwatch"></i>
          {formatTime(remainingTime)}
          {stopCountDownBtn && (
            <i
              className="fa-solid fa-xmark close-countdown"
              onClick={() => setCountDown(false)}
            ></i>
          )}
        </div>
      )}
    </>
  );
};
