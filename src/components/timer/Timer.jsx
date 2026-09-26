import { useContext, useEffect, useRef, useState } from 'react';
import { Context } from '../../context/context';

export const Timer = () => {
  const { setNotification, setStopAll, setStopFadeDuration } =
    useContext(Context);
  const [isOpen, setIsOpen] = useState(false);
  const minutesRef = useRef(null);
  const wrapperRef = useRef(null);
  const [countDown, setCountDown] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);

  const handleValidate = () => {
    const minutes = Number(minutesRef.current.value);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      setNotification({ message: 'Please enter a valid number of minutes.' });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    setRemainingTime(minutes * 60);
    setNotification({
      message: `Sounds will stop in ${minutes} minutes`,
    });
    setIsOpen(false);
    setTimeout(() => setNotification(null), 3000);
    setCountDown(true);
  };

  useEffect(() => {
    if (countDown && remainingTime > 0) {
      const intervalId = setInterval(() => {
        setRemainingTime(prevTime => prevTime - 1);
      }, 1000);

      return () => clearInterval(intervalId);
    } else if (countDown && remainingTime === 0) {
      setCountDown(false);
      setStopFadeDuration(20);
      setStopAll(true);
      setNotification({
        message: `Fading out gently… goodnight`,
      });
      setTimeout(() => setNotification(null), 4000);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countDown, remainingTime]);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = e => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    return () => document.removeEventListener('pointerdown', handleClickOutside);
  }, [isOpen]);

  const formatTime = time => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="bar-action-wrapper" ref={wrapperRef}>
      <button
        type="button"
        className={`bar-action${isOpen || countDown ? ' bar-action--active' : ''}`}
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Sleep timer"
        aria-expanded={isOpen}
      >
        <i className="fa-solid fa-stopwatch" aria-hidden="true" />
        <span className="bar-action__label">Timer</span>
        {countDown && (
          <span className="bar-action__badge" aria-live="polite">
            {formatTime(remainingTime)}
          </span>
        )}
      </button>
      {isOpen && (
        <div className="bar-popover" role="dialog" aria-label="Set timer">
          {countDown ? (
            <>
              <span className="bar-popover__countdown">
                {formatTime(remainingTime)}
              </span>
              <button
                type="button"
                className="bar-popover__cancel"
                onClick={() => {
                  setCountDown(false);
                  setIsOpen(false);
                }}
                aria-label="Cancel timer"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <input
                className="bar-popover__input"
                defaultValue={20}
                ref={minutesRef}
                type="number"
                min="1"
                aria-label="Minutes"
              />
              <button
                type="button"
                className="bar-popover__confirm"
                onClick={handleValidate}
                aria-label="Start timer"
              >
                <i className="fa-solid fa-check" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
