/**
 * Modal de cambio de estado de reserva
 * ELM-371 - Integrado con API-005 (UpdateReservationStatus)
 * Fuente: 04_apis_lista.md lineas 395-463
 */

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useReservationsStore } from '../../stores/reservationsStore';
import useAuthStore from '../../stores/authStore';
import { getStatusBadge } from '../../utils/reservationHelpers';

// Transiciones permitidas para admin (sigue la API-005)
const ADMIN_TRANSITIONS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'cancelled'],
  cancelled: [],
  completed: []
};

// Las agencias solo pueden cancelar reservas activas; ningún otro cambio.
const AGENCY_TRANSITIONS = {
  pending: ['cancelled'],
  confirmed: ['cancelled'],
  cancelled: [],
  completed: []
};

// Configuracion de estados
const STATUS_CONFIG = {
  pending: {
    label: 'Pendiente',
    bgClass: 'bg-gray-100',
    textClass: 'text-gray-800',
    hoverClass: 'hover:bg-gray-200'
  },
  confirmed: {
    label: 'Confirmada',
    bgClass: 'bg-green-100',
    textClass: 'text-green-800',
    hoverClass: 'hover:bg-green-200'
  },
  completed: {
    label: 'Completada',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-800',
    hoverClass: 'hover:bg-blue-200'
  },
  cancelled: {
    label: 'Cancelada',
    bgClass: 'bg-red-100',
    textClass: 'text-red-800',
    hoverClass: 'hover:bg-red-200'
  }
};

const StatusChangeModal = ({ reservation, isOpen, onClose, onStatusChanged }) => {
  const { t } = useTranslation();
  const { updateReservationStatus } = useReservationsStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [showCancellationInput, setShowCancellationInput] = useState(false);

  if (!isOpen || !reservation) return null;

  const currentStatus = reservation.status;
  const isAgency = user?.role === 'agency';
  const transitionsByRole = isAgency ? AGENCY_TRANSITIONS : ADMIN_TRANSITIONS;
  const allowedStatuses = transitionsByRole[currentStatus] || [];
  // Para agencia, la única acción posible es cancelar: saltar el paso intermedio
  // y mostrar el formulario de motivo desde el inicio.
  const cancellationFormVisible = showCancellationInput || (isAgency && allowedStatuses.includes('cancelled'));

  const handleStatusChange = async (newStatus) => {
    // Si es cancelacion, mostrar input para razon
    if (newStatus === 'cancelled' && !showCancellationInput) {
      setShowCancellationInput(true);
      return;
    }

    // Validar razon de cancelacion
    if (newStatus === 'cancelled' && !cancellationReason.trim()) {
      toast.error(t('validation.cancellationReasonRequired'));
      return;
    }

    setIsLoading(true);
    try {
      await updateReservationStatus(
        reservation.id,
        newStatus,
        newStatus === 'cancelled' ? cancellationReason : null
      );
      toast.success(`Estado cambiado a ${STATUS_CONFIG[newStatus]?.label || newStatus}`);
      onStatusChanged?.();
    } catch (error) {
      toast.error(error.message || t('reservations.comp.statusChangeError'));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    return STATUS_CONFIG[status]?.label || status;
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {isAgency
              ? t('reservations.cancelReservation', 'Cancelar Reserva')
              : t('reservations.changeStatus', 'Cambiar Estado de Reserva')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isLoading}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Info de la reserva */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Reserva:</span> #{reservation.id?.substring(0, 8)}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            <span className="font-medium">Tour:</span> {reservation.tourName || reservation.tour?.name || 'Sin tour'}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            <span className="font-medium">Estado actual:</span>{' '}
            <span className={`badge ${getStatusBadge(currentStatus)}`}>
              {getStatusLabel(currentStatus)}
            </span>
          </p>
        </div>

        {/* Estados disponibles */}
        {allowedStatuses.length > 0 ? (
          <div className="space-y-2">
            {!isAgency && (
              <p className="text-sm font-medium text-gray-700 mb-2">
                {t('reservations.selectNewStatus', 'Seleccionar nuevo estado:')}
              </p>
            )}

            {/* Agencia: el modal es exclusivo para cancelar, no mostrar selector de estados */}
            {!isAgency && allowedStatuses.map((status) => {
              const config = STATUS_CONFIG[status];
              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={isLoading}
                  className={`w-full px-4 py-2 text-sm rounded ${config.bgClass} ${config.textClass} ${config.hoverClass} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                >
                  {isLoading ? 'Procesando...' : config.label}
                </button>
              );
            })}

            {/* Input de razon de cancelacion */}
            {cancellationFormVisible && (
              <div className="mt-3 space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t('reservations.cancellationReason', 'Razon de cancelacion')} *
                </label>
                <textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Ingrese el motivo de la cancelacion..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  rows={3}
                  disabled={isLoading}
                />
                <button
                  onClick={() => handleStatusChange('cancelled')}
                  disabled={isLoading || !cancellationReason.trim()}
                  className="w-full px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Cancelando...' : 'Confirmar Cancelacion'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500">
              {t('reservations.noTransitionsAvailable', 'No hay transiciones de estado disponibles para esta reserva.')}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Las reservas canceladas o completadas no pueden cambiar de estado.
            </p>
          </div>
        )}

        {/* Boton cerrar */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="mt-4 w-full px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          {t('common.cancel', 'Cerrar')}
        </button>
      </div>
    </div>
  );
};

export default StatusChangeModal;
