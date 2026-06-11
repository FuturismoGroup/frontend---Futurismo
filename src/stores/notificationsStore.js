import { create } from 'zustand';
import i18next from 'i18next';
import { NOTIFICATION_TYPES } from '../utils/constants';
import notificationsService from '../services/notificationsService';

const useNotificationsStore = create((set, get) => ({
  // Estado
  notifications: [],
  unreadCount: 0,
  isVisible: false,
  soundEnabled: true,
  pushEnabled: false,
  preferences: null,
  stats: null,
  isLoading: false,
  error: null,
  
  // Paginación
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0
  },
  
  // Filtros
  filters: {
    type: '',
    category: '',
    read: undefined,
    startDate: '',
    endDate: ''
  },

  // Acciones
  fetchNotifications: async (userId) => {
    const { filters, pagination, notifications: currentNotifications } = get();

    set({ isLoading: true, error: null });

    try {
      const params = {
        ...filters,
        page: pagination.page,
        pageSize: pagination.pageSize
      };

      const result = await notificationsService.getNotifications(userId, params);

      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }

      // El backend responde { data: [...], pagination: {...}, unreadCount }
      // Se mantiene compatibilidad por si la forma fuese { notifications, page, ... }
      const payload = result.data || {};
      const backendNotifications = payload.data || payload.notifications || [];
      const paginationData = payload.pagination || {};

      // Preservar notificaciones locales de chat que no están en el backend
      const localChatNotifs = currentNotifications.filter(n =>
        n.category === 'chat' && !backendNotifications.some(bn => bn.id === n.id)
      );
      const unreadLocalChat = localChatNotifs.filter(n => !n.read).length;

      set({
        notifications: [...localChatNotifs, ...backendNotifications],
        unreadCount: (payload.unreadCount || 0) + unreadLocalChat,
        pagination: {
          page: paginationData.page ?? payload.page ?? 1,
          pageSize: paginationData.pageSize ?? payload.pageSize ?? pagination.pageSize,
          total: paginationData.total ?? payload.total ?? backendNotifications.length,
          totalPages: paginationData.totalPages ?? payload.totalPages ?? 1
        },
        isLoading: false
      });

      return result.data;
    } catch (error) {
      set({
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },
  
  addNotification: async (userId, notification) => {
    set({ isLoading: true, error: null });
    
    try {
      const notificationData = {
        userId,
        type: notification.type || NOTIFICATION_TYPES.INFO,
        title: notification.title,
        message: notification.message,
        category: notification.category || 'system',
        actionUrl: notification.actionUrl || null
      };
      
      const result = await notificationsService.createNotification(notificationData);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        notifications: [result.data, ...state.notifications],
        unreadCount: state.unreadCount + 1,
        isLoading: false
      }));
      
      // Reproducir sonido si está habilitado
      const { soundEnabled } = get();
      if (soundEnabled && notification.type !== NOTIFICATION_TYPES.INFO) {
        get().playNotificationSound();
      }
      
      // Mostrar notificación push si está habilitado
      const { pushEnabled } = get();
      if (pushEnabled) {
        get().showPushNotification(result.data);
      }
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  markAsRead: async (notificationId) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await notificationsService.markAsRead(notificationId);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => {
        const notifications = state.notifications.map(notif => 
          notif.id === notificationId ? result.data : notif
        );
        
        const unreadCount = notifications.filter(n => !n.read).length;
        
        return { 
          notifications, 
          unreadCount,
          isLoading: false
        };
      });
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  markAllAsRead: async () => {
    set({ isLoading: true, error: null });

    try {
      const result = await notificationsService.markAllAsRead();
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        notifications: state.notifications.map(notif => ({ ...notif, read: true })),
        unreadCount: 0,
        isLoading: false
      }));
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  removeNotification: async (notificationId) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await notificationsService.deleteNotification(notificationId);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => {
        const notifications = state.notifications.filter(n => n.id !== notificationId);
        const unreadCount = notifications.filter(n => !n.read).length;
        
        return { 
          notifications, 
          unreadCount,
          isLoading: false
        };
      });
      
      return true;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  clearAll: async () => {
    set({ isLoading: true, error: null });

    try {
      const result = await notificationsService.clearAll();
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        notifications: [],
        unreadCount: 0,
        isLoading: false
      });
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },

  toggleVisibility: () => {
    set((state) => ({ isVisible: !state.isVisible }));
  },

  setVisibility: (isVisible) => set({ isVisible }),

  toggleSound: async (userId) => {
    const { soundEnabled, preferences } = get();
    const newSoundEnabled = !soundEnabled;
    
    set({ soundEnabled: newSoundEnabled });
    
    // Actualizar preferencias en el servidor
    if (userId && preferences) {
      try {
        await notificationsService.updateUserPreferences(userId, {
          ...preferences,
          soundEnabled: newSoundEnabled
        });
      } catch (error) {
        // Revertir en caso de error
        set({ soundEnabled });
        throw error;
      }
    }
  },

  togglePush: async (userId) => {
    const { pushEnabled, preferences } = get();

    if (!pushEnabled) {
      // Verificar soporte de notificaciones push
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications no soportadas en este navegador');
        throw new Error(i18next.t('errors.unexpectedError'));
      }

      // Solicitar permisos
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        set({ pushEnabled: true });

        // Registrar suscripción push si hay usuario
        if (userId) {
          try {
            // Registrar service worker y obtener suscripción real
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY || null
            });

            // Convertir suscripción a formato JSON para enviar al backend
            const subscriptionData = subscription.toJSON();
            await notificationsService.subscribeToPush(userId, subscriptionData);

            // Actualizar preferencias
            if (preferences) {
              await notificationsService.updateUserPreferences(userId, {
                ...preferences,
                pushNotifications: true
              });
            }
          } catch (error) {
            console.error('Error al registrar push subscription:', error);
            set({ pushEnabled: false });
            throw error;
          }
        }
      }
    } else {
      set({ pushEnabled: false });
      
      // Desuscribir de push si hay usuario
      if (userId) {
        try {
          await notificationsService.unsubscribeFromPush(userId);
          
          // Actualizar preferencias
          if (preferences) {
            await notificationsService.updateUserPreferences(userId, {
              ...preferences,
              pushNotifications: false
            });
          }
        } catch (error) {
          set({ pushEnabled: true });
          throw error;
        }
      }
    }
  },

  playNotificationSound: () => {
    // En producción, reproducir un archivo de sonido
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZizMGFGG87OScTgwOUqzn4rVfFAVFnN7vw3AeBSF+zPLaizsIHWzA7OaeTBELT6ni57JdGQdHm97uwXIiBCV7x/HWiTsLG2S56+ScUg0PVqzl47VgGAZKmuDyvmwhBSl+zPDaizsIHGvA7OaeTBELT6ni57JdGQdHm97uwXIiBCV7x/HWiTsLG2S56+ScUg0PVqzl47VgGAZKmuDyvmwhBSl+zPDaizsIHGvA7OaeTBELT6ni57JdGQdHm97uwXIiBCV7x/HWiTsLG2S56+ScUg0PVqzl47VgGAZKmuDyvmwhBSl+zPDaizsIHGvA7OaeTBELT6ni57JdGQdHm97uwXIiBCV7x/HWiTsLG2S56+ScUg0PVqzl47VgGAZKmuDyvmwhBSl+zPDaizsIHGvA7OaeTBELT6ni57JdGQdHm97uwXIiBCV7x/HWiTsLG2S56+ScUg0PVqzl47VgGAZKmuDyvmwhBSl+zPDaizsIHGvA7OaeTBELT6ni57JdGQdHm97uwXIiBCV7x/HWiTsLG2S56+ScUg0PVqzl47VgGAZKmuDyvmwhBSl+zPDaizsIHGvA7OaeTBELT6ni57JdGQdHm97uwXIiBCV7x/HWiTsLG2S56+ScUg0PVqzl47VgGAZKmuDyvmwhBSl+zPDaizsIHGvA7OaeTBELT6ni57JdGQdHm97uwXIiBCV7x/HWiTsLG2S56+ScUg0PVqzl47VgGAZKmuDyvmwhBSl+zPDaizsIHGvA7OaeODAJQBUFDx+z0kgAAAAASUVORK5CYII=');
    audio.volume = 0.5;
    audio.play().catch(() => {
      // Manejar error silenciosamente
    });
  },

  showPushNotification: (notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notif = new Notification('Futurismo', {
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: notification.id,
        requireInteraction: notification.type === NOTIFICATION_TYPES.ERROR
      });
      
      notif.onclick = () => {
        window.focus();
        notif.close();
        get().markAsRead(notification.id);
      };
    }
  },

  // Preferencias de usuario
  fetchUserPreferences: async (userId) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await notificationsService.getUserPreferences(userId);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        preferences: result.data,
        soundEnabled: result.data.soundEnabled || true,
        pushEnabled: result.data.pushNotifications || false,
        isLoading: false
      });
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },
  
  updateUserPreferences: async (userId, preferences) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await notificationsService.updateUserPreferences(userId, preferences);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        preferences: result.data,
        soundEnabled: result.data.soundEnabled || true,
        pushEnabled: result.data.pushNotifications || false,
        isLoading: false
      });
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },
  
  // Estadísticas
  fetchNotificationStats: async (userId) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await notificationsService.getNotificationStats(userId);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set({
        stats: result.data,
        isLoading: false
      });
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },
  
  // Notificaciones desde plantillas
  createFromTemplate: async (templateId, params) => {
    set({ isLoading: true, error: null });
    
    try {
      const result = await notificationsService.createFromTemplate(templateId, params);
      
      if (!result.success) {
        throw new Error(result.error || i18next.t('errors.unexpectedError'));
      }
      
      set((state) => ({
        notifications: [result.data, ...state.notifications],
        unreadCount: state.unreadCount + 1,
        isLoading: false
      }));
      
      // Reproducir sonido y mostrar push si está habilitado
      const { soundEnabled, pushEnabled } = get();
      if (soundEnabled && result.data.type !== NOTIFICATION_TYPES.INFO) {
        get().playNotificationSound();
      }
      if (pushEnabled) {
        get().showPushNotification(result.data);
      }
      
      return result.data;
    } catch (error) {
      set({ 
        isLoading: false,
        error: error.message
      });
      throw error;
    }
  },
  
  // Notificaciones predefinidas (ahora usando plantillas)
  notifyServiceUpdate: async (userId, serviceCode, status) => {
    return get().createFromTemplate('serviceUpdate', {
      userId,
      serviceCode,
      status,
      actionUrl: `/monitoring?service=${serviceCode}`
    });
  },

  notifyNewReservation: async (userId, reservationCode) => {
    return get().createFromTemplate('reservationConfirmed', {
      userId,
      code: reservationCode,
      actionUrl: `/reservations/${reservationCode}`
    });
  },

  notifyError: async (userId, message) => {
    return get().addNotification(userId, {
      type: NOTIFICATION_TYPES.ERROR,
      title: 'Error',
      message,
      category: 'system'
    });
  },

  notifyWarning: async (userId, message) => {
    return get().addNotification(userId, {
      type: NOTIFICATION_TYPES.WARNING,
      title: 'Advertencia',
      message,
      category: 'system'
    });
  },

  // Filtros y paginación
  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, page: 1 }
    }));
  },
  
  setPage: (page) => {
    set((state) => ({
      pagination: { ...state.pagination, page }
    }));
  },
  
  // Utilidades
  clearError: () => set({ error: null }),
  
  resetStore: () => {
    set({
      notifications: [],
      unreadCount: 0,
      isVisible: false,
      soundEnabled: true,
      pushEnabled: false,
      preferences: null,
      stats: null,
      isLoading: false,
      error: null,
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0
      },
      filters: {
        type: '',
        category: '',
        read: undefined,
        startDate: '',
        endDate: ''
      }
    });
  }
}));

export { useNotificationsStore };
export default useNotificationsStore;