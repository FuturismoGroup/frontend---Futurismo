// Servicio WebSocket para comunicacion en tiempo real
// Conecta con el servidor Socket.io del backend

import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.listeners = new Map();
    this.isConnecting = false;
    this.activeRooms = new Set(); // Tracking de rooms activas para re-join
    this.pendingJoins = []; // Callbacks pendientes de conexion
    // Cache del último presence:initial para re-emitir a suscriptores tardíos.
    // El backend solo lo manda al conectar el socket; los hooks que montan después
    // (ej: navegar a /chat) lo perderían sin este cache.
    this.lastPresenceSnapshot = null;
  }

  /**
   * Conecta al servidor WebSocket
   * @param {string} token - Token JWT de autenticacion
   */
  connect(token) {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    if (!token) {
      console.warn('[WebSocket] No se proporciono token de autenticacion');
      return;
    }

    this.isConnecting = true;
    const wsUrl = this.getWebSocketUrl();
    console.log('[WebSocket] Conectando a:', wsUrl);

    this.socket = io(wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 20000
    });

    this.setupEventHandlers();
  }

  /**
   * Determina la URL del WebSocket basandose en el entorno
   * @returns {string} URL del WebSocket
   */
  getWebSocketUrl() {
    // Usar VITE_WS_URL si esta definida (prioridad)
    if (import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }

    // En produccion, usar la misma URL que el frontend
    if (import.meta.env.PROD) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${protocol}//${window.location.host}`;
    }

    // Fallback: derivar de VITE_API_URL quitando /api
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const baseUrl = apiUrl.replace(/\/api$/, ''); // Quitar /api del final
    return baseUrl.replace(/^http/, 'ws');
  }

  /**
   * Configura los handlers de eventos de Socket.io
   */
  setupEventHandlers() {
    // Conexion establecida
    this.socket.on('connect', () => {
      console.log('[WebSocket] Conectado:', this.socket.id);
      this.reconnectAttempts = 0;
      this.isConnecting = false;

      // Re-join a todas las rooms activas (despues de reconexion)
      if (this.activeRooms.size > 0) {
        console.log('[WebSocket] Re-joining rooms:', [...this.activeRooms]);
        this.activeRooms.forEach((chatId) => {
          this.socket.emit('chat:join', { chatId });
        });
      }

      // Ejecutar callbacks pendientes
      while (this.pendingJoins.length > 0) {
        const callback = this.pendingJoins.shift();
        try {
          callback();
        } catch (err) {
          console.error('[WebSocket] Error en callback pendiente:', err);
        }
      }

      this.emit('connection:established', { socketId: this.socket.id });
    });

    // Desconexion
    this.socket.on('disconnect', (reason) => {
      console.log('[WebSocket] Desconectado:', reason);
      this.emit('connection:lost', { reason });
    });

    // Error de conexion
    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Error de conexion:', error.message);
      this.reconnectAttempts++;
      this.isConnecting = false;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        this.emit('connection:failed', { error: error.message });
      }
    });

    // Reconexion exitosa
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('[WebSocket] Reconectado despues de', attemptNumber, 'intentos');
      this.emit('connection:reconnected', { attempts: attemptNumber });
    });

    // === Eventos de Chat ===

    // Nuevo mensaje recibido
    this.socket.on('chat:message:new', (data) => {
      this.emit('chat:message:new', data);
    });

    // Estado de mensaje actualizado
    this.socket.on('chat:message:status', (data) => {
      this.emit('chat:message:status', data);
    });

    // Usuario escribiendo
    this.socket.on('chat:typing', (data) => {
      this.emit('chat:typing', data);
    });

    // Mensajes leidos
    this.socket.on('chat:read:update', (data) => {
      this.emit('chat:read:update', data);
    });

    // Usuario se unio al chat
    this.socket.on('chat:user:joined', (data) => {
      this.emit('chat:user:joined', data);
    });

    // Usuario salio del chat
    this.socket.on('chat:user:left', (data) => {
      this.emit('chat:user:left', data);
    });

    // === Eventos de Presencia ===

    // Snapshot inicial de usuarios online (al conectarse)
    this.socket.on('presence:initial', (data) => {
      // Mantener una copia mutable del snapshot — los user:online/offline
      // posteriores actualizan este Set para que suscriptores tardíos vean
      // el estado real al momento de subscribirse.
      const ids = Array.isArray(data?.onlineUserIds) ? data.onlineUserIds : [];
      this.lastPresenceSnapshot = {
        onlineUserIds: new Set(ids),
        timestamp: data?.timestamp || new Date().toISOString()
      };
      this.emit('presence:initial', data);
    });

    // Usuario conectado
    this.socket.on('user:online', (data) => {
      if (this.lastPresenceSnapshot && data?.userId) {
        this.lastPresenceSnapshot.onlineUserIds.add(data.userId);
      }
      this.emit('user:online', data);
    });

    // Usuario desconectado
    this.socket.on('user:offline', (data) => {
      if (this.lastPresenceSnapshot && data?.userId) {
        this.lastPresenceSnapshot.onlineUserIds.delete(data.userId);
      }
      this.emit('user:offline', data);
    });

    // === Eventos de Notificaciones ===

    // Nueva notificacion
    this.socket.on('notification:new', (data) => {
      this.emit('notification:new', data);
    });

    // Contador de notificaciones no leidas
    this.socket.on('notification:unread:count', (data) => {
      this.emit('notification:unread:count', data);
    });

    // Notificacion marcada como leida
    this.socket.on('notification:read', (data) => {
      this.emit('notification:read', data);
    });

    // Todas las notificaciones marcadas como leidas
    this.socket.on('notification:all:read', (data) => {
      this.emit('notification:all:read', data);
    });

    // === Eventos de Unread Count ===

    // Actualizacion de contador de no leidos
    this.socket.on('unread:update', (data) => {
      this.emit('unread:update', data);
    });

    // === Eventos de Monitoreo GPS ===

    // Ubicacion de guia actualizada (para admins/agencias)
    this.socket.on('guide:location:updated', (data) => {
      this.emit('guide:location:updated', data);
    });

    // Confirmacion de ubicacion enviada (para guias)
    this.socket.on('guide:location:ack', (data) => {
      this.emit('guide:location:ack', data);
    });

    // Error al enviar ubicacion (para guias)
    this.socket.on('guide:location:error', (data) => {
      this.emit('guide:location:error', data);
    });

    // Cambio de estado de tour (para admins/agencias)
    this.socket.on('monitoring:tour:status', (data) => {
      this.emit('monitoring:tour:status', data);
    });

    // === Errores ===
    this.socket.on('error', (data) => {
      console.error('[WebSocket] Error:', data);
      this.emit('error', data);
    });
  }

  /**
   * Desconecta del servidor WebSocket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      this.isConnecting = false;
      this.activeRooms.clear();
      this.pendingJoins = [];
    }
  }

  // === Metodos de Chat ===

  /**
   * Unirse a una sala de chat
   * @param {string} chatId - ID del chat
   */
  joinChatRoom(chatId) {
    if (!chatId) return;

    // Agregar a rooms activas para re-join automatico
    this.activeRooms.add(chatId);

    if (this.socket?.connected) {
      console.log('[WebSocket] Joining room:', chatId);
      this.socket.emit('chat:join', { chatId });
    } else {
      // Encolar para cuando se conecte
      console.log('[WebSocket] Encolando join para room:', chatId);
      this.pendingJoins.push(() => {
        this.socket.emit('chat:join', { chatId });
      });
    }
  }

  /**
   * Salir de una sala de chat
   * @param {string} chatId - ID del chat
   */
  leaveChatRoom(chatId) {
    if (!chatId) return;

    // Remover de rooms activas
    this.activeRooms.delete(chatId);

    if (this.socket?.connected) {
      console.log('[WebSocket] Leaving room:', chatId);
      this.socket.emit('chat:leave', { chatId });
    }
  }

  /**
   * Enviar mensaje de texto por WebSocket
   * @param {string} chatId - ID del chat
   * @param {string} content - Contenido del mensaje (texto plano)
   */
  sendMessage(chatId, content) {
    if (!this.socket?.connected || !chatId || !content) return;
    this.socket.emit('chat:message:send', {
      chatId,
      content
    });
  }

  /**
   * Enviar indicador de escritura
   * @param {string} chatId - ID del chat
   * @param {boolean} isTyping - Si esta escribiendo
   */
  sendTypingIndicator(chatId, isTyping) {
    if (!this.socket?.connected || !chatId) return;
    this.socket.emit('chat:typing', { chatId, isTyping });
  }

  /**
   * Marcar mensajes como leidos
   * @param {string} chatId - ID del chat
   */
  markAsRead(chatId) {
    if (!this.socket?.connected || !chatId) return;
    this.socket.emit('chat:read', { chatId });
  }

  // === Metodos de Monitoreo GPS ===

  /**
   * Enviar ubicacion GPS del guia via WebSocket
   * @param {Object} locationData - Datos de ubicacion
   * @param {number} locationData.latitude - Latitud
   * @param {number} locationData.longitude - Longitud
   * @param {number} locationData.accuracy - Precision en metros
   * @param {number} locationData.speed - Velocidad en m/s
   * @param {string} locationData.reservationId - ID de reservacion (opcional)
   */
  sendGuideLocation(locationData) {
    if (!this.socket?.connected || !locationData) return false;
    this.socket.emit('guide:location:send', locationData);
    return true;
  }

  /**
   * Unirse a room de monitoreo de un tour especifico
   * @param {string} activeTourId - ID del tour activo
   */
  joinTourMonitoring(activeTourId) {
    if (!this.socket?.connected || !activeTourId) return;
    this.socket.emit('monitoring:tour:join', { activeTourId });
  }

  /**
   * Salir de room de monitoreo de un tour
   * @param {string} activeTourId - ID del tour activo
   */
  leaveTourMonitoring(activeTourId) {
    if (!this.socket?.connected || !activeTourId) return;
    this.socket.emit('monitoring:tour:leave', { activeTourId });
  }

  /**
   * Guia se une a la room de su tour
   * @param {string} activeTourId - ID del tour activo
   */
  joinGuideTour(activeTourId) {
    if (!this.socket?.connected || !activeTourId) return;
    this.socket.emit('guide:tour:join', { activeTourId });
  }

  // === Sistema de Eventos Interno ===

  /**
   * Suscribirse a un evento
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Funcion callback
   * @returns {Function} Funcion para desuscribirse
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);

    // Retornar funcion para desuscribirse
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        callbacks.delete(callback);
      }
    };
  }

  /**
   * Desuscribirse de un evento
   * @param {string} event - Nombre del evento
   * @param {Function} callback - Funcion callback
   */
  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emitir evento interno a los listeners
   * @param {string} event - Nombre del evento
   * @param {*} data - Datos del evento
   */
  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[WebSocket] Error en listener de ${event}:`, error);
        }
      });
    }
  }

  // === Utilidades ===

  /**
   * Ejecutar callback cuando se conecte
   * Si ya esta conectado, ejecuta inmediatamente
   * @param {Function} callback - Funcion a ejecutar
   */
  onConnected(callback) {
    if (this.socket?.connected) {
      callback();
    } else {
      this.pendingJoins.push(callback);
    }
  }

  /**
   * Verificar si esta conectado
   * @returns {boolean}
   */
  isConnected() {
    return this.socket?.connected || false;
  }

  /**
   * Devuelve el snapshot actual de usuarios online (si ya se recibió presence:initial).
   * Necesario para hooks que se montan DESPUÉS del login: el evento
   * presence:initial ya se disparó y se perdería sin este cache.
   * @returns {string[]} Array de userIds online
   */
  getOnlineUserIds() {
    if (!this.lastPresenceSnapshot) return [];
    return Array.from(this.lastPresenceSnapshot.onlineUserIds);
  }

  /**
   * Obtener ID del socket
   * @returns {string|null}
   */
  getSocketId() {
    return this.socket?.id || null;
  }
}

// Exportar instancia unica (singleton)
const webSocketService = new WebSocketService();

export default webSocketService;
