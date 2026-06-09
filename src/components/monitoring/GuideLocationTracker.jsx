/**
 * GuideLocationTracker
 * Componente invisible que se monta en el layout para usuarios con rol guide.
 * Mantiene un único stream de geolocalización mientras el guía tenga al menos
 * un tour en estado in_progress, y envía la ubicación al backend cada cierto
 * intervalo (preferentemente vía WebSocket; HTTP como fallback).
 *
 * Antes esto sólo ocurría dentro de GuideTourView, por lo que si el guía
 * dejaba esa página el monitoreo dejaba de actualizarse y los marcadores en el
 * mapa de Admin/Agencia mostraban posiciones de respaldo (todas similares).
 * Con este tracker el GPS sigue activo en dashboard, agenda, perfil, etc.
 */
import { useEffect, useRef, useState } from 'react';
import useAuthStore from '../../stores/authStore';
import toursService from '../../services/toursService';
import monitoringService from '../../services/monitoringService';
import webSocketService from '../../services/websocket';

// Cada cuánto preguntamos al backend si hay un tour in_progress activo.
const TOUR_REFRESH_MS = 60_000;
// Cada cuánto enviamos la última ubicación al backend mientras hay tour activo.
const SEND_INTERVAL_MS = 15_000;

const GuideLocationTracker = () => {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [hasActiveTour, setHasActiveTour] = useState(false);

  const watchIdRef = useRef(null);
  const lastPositionRef = useRef(null);
  const sendIntervalRef = useRef(null);
  const refreshIntervalRef = useRef(null);

  const isGuide = user?.role === 'guide';

  // Detecta si el guía tiene algún tour in_progress (sin importar página).
  // Se polea cada minuto y además al recibir un evento WS de cambio de estado
  // para reaccionar rápido cuando el guía recién inicia un servicio.
  useEffect(() => {
    if (!isAuthenticated || !isGuide) {
      setHasActiveTour(false);
      return;
    }

    let cancelled = false;

    const checkActiveTour = async () => {
      try {
        const guideId = user?.guideId || user?.id;
        if (!guideId) return;
        const response = await toursService.getGuideTours(guideId);
        if (cancelled) return;
        if (response?.success && Array.isArray(response.data)) {
          const hasInProgress = response.data.some(t => t.status === 'in_progress');
          setHasActiveTour(hasInProgress);
        }
      } catch (err) {
        // Sin tour activo o error de red: dejamos hasActiveTour como estaba.
        console.warn('[GuideLocationTracker] Error consultando tours del guía:', err?.message);
      }
    };

    checkActiveTour();
    refreshIntervalRef.current = setInterval(checkActiveTour, TOUR_REFRESH_MS);

    const unsubscribe = webSocketService.on('monitoring:tour:status', () => {
      checkActiveTour();
    });

    return () => {
      cancelled = true;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      unsubscribe?.();
    };
  }, [isAuthenticated, isGuide, user?.guideId, user?.id]);

  // Activa/desactiva el watcher de geolocalización en función de hasActiveTour.
  // Mantenemos lastPositionRef siempre poblado por watchPosition (es barato) y
  // un setInterval para enviar al backend con un ritmo conocido.
  useEffect(() => {
    if (!hasActiveTour) {
      stopTracking();
      return undefined;
    }

    if (!navigator.geolocation) {
      console.warn('[GuideLocationTracker] Geolocation no disponible en este navegador');
      return undefined;
    }

    const geoOptions = {
      enableHighAccuracy: true,
      timeout: 15_000,
      maximumAge: 5_000
    };

    // Envío inicial: pedir posición y mandarla apenas la obtengamos.
    navigator.geolocation.getCurrentPosition(
      (position) => {
        lastPositionRef.current = position;
        sendLocation(position);
      },
      (error) => console.warn('[GuideLocationTracker] Error obteniendo posición inicial:', error?.message),
      geoOptions
    );

    // Watcher continuo: solo guarda la última posición, no la envía cada vez
    // (evitamos saturar el backend con cada micro-movimiento).
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        lastPositionRef.current = position;
      },
      (error) => console.warn('[GuideLocationTracker] Error en watchPosition:', error?.message),
      geoOptions
    );

    // Envío periódico de la última posición conocida.
    sendIntervalRef.current = setInterval(() => {
      if (lastPositionRef.current) {
        sendLocation(lastPositionRef.current);
      }
    }, SEND_INTERVAL_MS);

    return () => {
      stopTracking();
    };
  }, [hasActiveTour]);

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (sendIntervalRef.current !== null) {
      clearInterval(sendIntervalRef.current);
      sendIntervalRef.current = null;
    }
    lastPositionRef.current = null;
  };

  const sendLocation = async (position) => {
    try {
      const maxDecimalValue = 9999.99;
      const payload = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
          ? Math.min(position.coords.accuracy, maxDecimalValue)
          : null,
        speed: position.coords.speed
          ? Math.min(position.coords.speed, maxDecimalValue)
          : null
      };

      const sentViaWs = webSocketService.sendGuideLocation(payload);
      if (!sentViaWs) {
        await monitoringService.updateLocation(payload);
      }
    } catch (err) {
      console.warn('[GuideLocationTracker] No se pudo enviar ubicación:', err?.message);
    }
  };

  return null;
};

export default GuideLocationTracker;
