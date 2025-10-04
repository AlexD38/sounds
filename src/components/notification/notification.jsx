import { useContext, useEffect, useState } from 'react';
import './styles.css';
import { Context } from '../../context/context';

export const Notification = () => {
  const { notification } = useContext(Context);
  const [iconLabel, setIconLabel] = useState('');

  useEffect(() => {
    if (notification && notification.message) {
      if (notification.message.includes('Successfully')) {
        setIconLabel('check-circle');
      }
      if (notification.message.includes('Now')) {
        setIconLabel('music');
      }
      if (notification.message.includes('cannot')) {
        setIconLabel('ban');
      }
    }
  }, [notification]);

  return (
    notification && (
      <div className="notification">
        <i class={`fa-solid fa-${iconLabel} notif-icon`}></i>
        {notification?.message}
      </div>
    )
  );
};
