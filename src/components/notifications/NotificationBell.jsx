import React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellIconSolid } from '@heroicons/react/24/solid';
import { useNotificationsStore } from '../../stores/notificationsStore';
import { useAuthStore } from '../../stores/authStore';
import NotificationCenter from './NotificationCenter';

const NotificationBell = () => {
  const { 
    unreadCount, 
    isVisible, 
    toggleVisibility,
    fetchNotifications
  } = useNotificationsStore();
  
  const { user } = useAuthStore();

  const handleClick = async () => {
    if (!isVisible && user?.id) {
      await fetchNotifications(user.id);
    }
    toggleVisibility();
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="relative p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-all duration-200"
        aria-label={`Notificaciones ${unreadCount > 0 ? `(${unreadCount} sin leer)` : ''}`}
      >
        {unreadCount > 0 ? (
          <BellIconSolid className="h-5 w-5 text-blue-600" />
        ) : (
          <BellIcon className="h-5 w-5" />
        )}

        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full min-w-[18px] shadow-sm">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      <NotificationCenter />
    </div>
  );
};

export default NotificationBell;