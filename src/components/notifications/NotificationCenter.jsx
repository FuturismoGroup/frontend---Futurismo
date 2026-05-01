import React, { useEffect, useRef } from 'react';
import { XMarkIcon, CheckIcon, TrashIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useNotificationsStore } from '../../stores/notificationsStore';
import { useAuthStore } from '../../stores/authStore';
import NotificationItem from './NotificationItem';

const NotificationCenter = () => {
  const {
    notifications,
    isVisible,
    unreadCount,
    isLoading,
    error,
    setVisibility,
    markAllAsRead,
    clearAll,
    fetchNotifications
  } = useNotificationsStore();
  
  const { user } = useAuthStore();

  useEffect(() => {
    if (isVisible && user?.id && (!notifications || notifications.length === 0)) {
      fetchNotifications(user.id);
    }
  }, [isVisible, user?.id, notifications?.length, fetchNotifications]);

  const handleClose = () => {
    setVisibility(false);
  };

  const handleMarkAllAsRead = async () => {
    if (user?.id && unreadCount > 0) {
      try {
        await markAllAsRead(user.id);
      } catch (error) {
        console.error('Error marking all as read:', error);
      }
    }
  };

  const handleClearAll = async () => {
    if (user?.id && notifications && notifications.length > 0) {
      try {
        await clearAll(user.id);
      } catch (error) {
        console.error('Error clearing notifications:', error);
      }
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay transparente para cerrar al hacer click fuera */}
      <div
        className="fixed inset-0 z-40"
        onClick={handleClose}
      />

      {/* Dropdown con animación */}
      <div 
        className="absolute right-0 top-full mt-2 w-full sm:w-96 max-w-[calc(100vw-2rem)] sm:max-w-96 bg-white rounded-lg shadow-xl z-50 flex flex-col max-h-[calc(100vh-5rem)] border border-gray-200 transition-all duration-200 ease-out"
        style={{
          animation: 'dropdownSlideIn 0.2s ease-out'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b rounded-t-lg">
          <h2 className="text-lg font-semibold text-gray-900">
            Notificaciones
            {unreadCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {unreadCount}
              </span>
            )}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2 p-3 border-b bg-gray-50">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1 px-2 py-1 text-xs sm:text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Marcar todas como leídas</span>
              <span className="sm:hidden">Marcar leídas</span>
            </button>
          )}
          
          {notifications?.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 px-2 py-1 text-xs sm:text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isLoading}
            >
              <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Limpiar todo</span>
              <span className="sm:hidden">Limpiar</span>
            </button>
          )}
          
          <div className="flex-1" />
          
          <button className="p-1 sm:p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <Cog6ToothIcon className="h-3 w-3 sm:h-4 sm:w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && (!notifications || notifications.length === 0) ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="p-4 text-center">
              <div className="text-red-600 text-sm">{error}</div>
              <button
                onClick={() => user?.id && fetchNotifications(user.id)}
                className="mt-2 text-blue-600 hover:text-blue-700 text-sm underline"
              >
                Reintentar
              </button>
            </div>
          ) : !notifications || notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <CheckIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tienes notificaciones
              </h3>
              <p className="text-gray-500 text-sm">
                Cuando tengas nuevas notificaciones aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications?.length > 10 && (
          <div className="border-t p-4 text-center rounded-b-lg">
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Ver todas las notificaciones
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default NotificationCenter;