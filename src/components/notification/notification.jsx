import { useContext, useEffect, useState } from 'react';
import './styles.css';
import { Context } from '../../context/context';

export const Notification = () => {
  const { notification } = useContext(Context);
  const [iconLabel, setIconLabel] = useState('');

  useEffect(() => {
    if (notification?.message) {
      let icon = 'circle-info';
      if (notification.message.includes('Successfully')) icon = 'check-circle';
      else if (notification.message.includes('Now')) icon = 'music';
      else if (notification.message.includes('cannot')) icon = 'ban';
      else if (notification.message.includes('Goodnight')) icon = 'moon';
      else if (notification.message.includes('minutes')) icon = 'stopwatch';
      else if (notification.message.includes('saved')) icon = 'floppy-disk';
      setIconLabel(icon);
    }
  }, [notification]);

  return (
    notification && (
      <div className="notification" role="status" aria-live="polite">
        {iconLabel && (
          <i className={`fa-solid fa-${iconLabel} notif-icon`} aria-hidden="true" />
        )}
        <span>{notification.message}</span>
      </div>
    )
  );
};
