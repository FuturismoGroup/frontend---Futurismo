import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon,
  EyeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { useNotificationsStore } from '../../stores/notificationsStore';
import { NOTIFICATION_TYPES } from '../../utils/constants';

const getNotificationIcon = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.SUCCESS:
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    case NOTIFICATION_TYPES.WARNING:
      return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
    case NOTIFICATION_TYPES.ERROR:
      return <XCircleIcon className="h-5 w-5 text-red-500" />;
    default:
      return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
  }
};

const getNotificationColors = (type) => {
  switch (type) {
    case NOTIFICATION_TYPES.SUCCESS:
      return 'border-l-green-500 bg-green-50';
    case NOTIFICATION_TYPES.WARNING:
      return 'border-l-yellow-500 bg-yellow-50';
    case NOTIFICATION_TYPES.ERROR:
      return 'border-l-red-500 bg-red-50';
    default:
      return 'border-l-blue-500 bg-blue-50';
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes}m`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days < 7) return `Hace ${days}d`;
  
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short'
  });
};

const NotificationItem = ({ notification }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { markAsRead, removeNotification, setVisibility } = useNotificationsStore();

  const handleMarkAsRead = async (e) => {
    e.stopPropagation();
    if (!notification.read) {
      try {
        await markAsRead(notification.id);
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  const handleRemove = async (e) => {
    e.stopPropagation();
    try {
      await removeNotification(notification.id);
    } catch (error) {
      console.error('Error removing notification:', error);
    }
  };

  const handleClick = () => {
    if (!notification.read) {
      handleMarkAsRead({ stopPropagation: () => {} });
    }
    
    if (notification.actionUrl) {
      setVisibility(false); // Close notification center
      navigate(notification.actionUrl);
    }
  };

  return (
    <div
      className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer group ${
        !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${
                !notification.read ? 'text-gray-900' : 'text-gray-700'
              }`}>
                {notification.title}
              </h4>
              <p className={`text-sm mt-1 ${
                !notification.read ? 'text-gray-700' : 'text-gray-500'
              }`}>
                {notification.message}
              </p>
              
              {notification.category && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 mt-2">
                  {notification.category}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1 ml-2">
              <span className="text-xs text-gray-500">
                {formatDate(notification.createdAt)}
              </span>
              
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-600 rounded-full ml-2"></div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-end gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.read && (
          <button
            onClick={handleMarkAsRead}
            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
            title={t('notifications.markAsRead')}
          >
            <EyeIcon className="h-4 w-4" />
          </button>
        )}
        
        <button
          onClick={handleRemove}
          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
          title={t('notifications.deleteNotification')}
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default NotificationItem;