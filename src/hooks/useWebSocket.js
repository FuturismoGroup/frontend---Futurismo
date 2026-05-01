// Hook para gestion de conexion WebSocket
// Conecta automaticamente cuando hay usuario autenticado

import { useEffect, useState, useCallback } from 'react';
import webSocketService from '../services/websocket';
import { useAuthStore } from '../stores/authStore';

/**
 * Hook para gestionar la conexion WebSocket
 * Se conecta automaticamente cuando hay un usuario autenticado
 * @returns {Object} Estado y metodos del WebSocket
 */
const useWebSocket = () => {
  const { user, token } = useAuthStore();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  // Conectar cuando hay usuario y token
  useEffect(() => {
    if (user && token) {
      webSocketService.connect(token);
    }

    return () => {
      // No desconectar en cleanup para mantener la conexion entre navegaciones
      // La desconexion se maneja en el logout
    };
  }, [user, token]);

  // Escuchar eventos de conexion
  useEffect(() => {
    const unsubConnected = webSocketService.on('connection:established', () => {
      setIsConnected(true);
      setConnectionError(null);
    });

    const unsubLost = webSocketService.on('connection:lost', () => {
      setIsConnected(false);
    });

    const unsubFailed = webSocketService.on('connection:failed', (data) => {
      setIsConnected(false);
      setConnectionError(data?.error || 'Error de conexion');
    });

    const unsubReconnected = webSocketService.on('connection:reconnected', () => {
      setIsConnected(true);
      setConnectionError(null);
    });

    // Verificar estado inicial
    setIsConnected(webSocketService.isConnected());

    return () => {
      unsubConnected();
      unsubLost();
      unsubFailed();
      unsubReconnected();
    };
  }, []);

  // Metodo para desconectar manualmente (usado en logout)
  const disconnect = useCallback(() => {
    webSocketService.disconnect();
    setIsConnected(false);
  }, []);

  // Metodo para reconectar
  const reconnect = useCallback(() => {
    if (token) {
      webSocketService.disconnect();
      webSocketService.connect(token);
    }
  }, [token]);

  return {
    isConnected,
    connectionError,
    disconnect,
    reconnect,
    webSocketService
  };
};

export default useWebSocket;
