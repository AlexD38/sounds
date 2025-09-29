import { useContext } from 'react';
import './styles.css';
import { Context } from '../../context/context';

export const Notification = () => {
  const { notification } = useContext(Context);

  return (
    notification && <div className="notification">{notification?.message}</div>
  );
};
