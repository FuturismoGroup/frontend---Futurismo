import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PlusIcon,
  Cog6ToothIcon,
  ArrowLeftIcon,
  TrashIcon,
  XMarkIcon,
  MapPinIcon,
  ClockIcon,
  UsersIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  CalendarDaysIcon,
  TagIcon,
  PencilSquareIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  SparklesIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import ServicesList from '../components/services/ServicesList';
import ServiceForm from '../components/services/ServiceForm';
import ServiceTypesSettings from '../components/settings/ServiceTypesSettings';
import { useToursStore } from '../stores/toursStore';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

const ServicesManagement = () => {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'edit', 'view', 'config'
  const [selectedService, setSelectedService] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null); // Modal de eliminación personalizado
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictInfo, setConflictInfo] = useState(null); // Info del conflicto (reservas activas)

  const { deleteTour, loadTours, getTourById } = useToursStore();
  const { user } = useAuthStore();

  const handleCreateService = () => {
    setSelectedService(null);
    setCurrentView('create');
  };

  const handleEditService = async (service) => {
    // El listado solo trae stopsCount; el itinerario completo viene en GET /tours/:id.
    // Sin este fetch el formulario abriria con stops vacio.
    setCurrentView('edit');
    setSelectedService(service);
    try {
      const fullService = await getTourById(service.id);
      if (fullService) {
        setSelectedService(fullService);
      }
    } catch (error) {
      console.error('Error al cargar detalle del servicio:', error);
      toast.error(t('errors.unexpectedError'));
    }
  };

  const handleViewService = (service) => {
    setSelectedService(service);
    setCurrentView('view');
  };

  const handleDeleteService = (service) => {
    setServiceToDelete(service);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (serviceToDelete) {
      try {
        await deleteTour(serviceToDelete.id);
        setShowDeleteModal(false);
        setServiceToDelete(null);
        toast.success('Servicio eliminado correctamente');
        // Recargar la lista de tours
        await loadTours();
        // Si estamos en la vista de detalles, volver a la lista
        if (currentView === 'view') {
          setCurrentView('list');
          setSelectedService(null);
        }
      } catch (error) {
        console.error('Error al eliminar servicio:', error);
        setShowDeleteModal(false);

        // Verificar si es error de conflicto (reservas activas)
        const errorMessage = error.message || '';
        const isConflict = errorMessage.includes('reserva') || error.status === 409;

        if (isConflict) {
          // Extraer número de reservas del mensaje
          const match = errorMessage.match(/(\d+)\s*reserva/);
          const reservationCount = match ? parseInt(match[1]) : null;

          setConflictInfo({
            serviceName: serviceToDelete.name || serviceToDelete.code,
            reservationCount: reservationCount,
            message: errorMessage
          });
          setShowConflictModal(true);
        } else {
          toast.error(errorMessage || 'Error al eliminar el servicio');
        }

        setServiceToDelete(null);
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setServiceToDelete(null);
  };

  const handleFormSubmit = async (serviceData) => {
    setIsLoading(true);
    try {
      // Recargar la lista de tours para reflejar los cambios
      await loadTours();

      // Volver a la vista de lista
      setCurrentView('list');
      setSelectedService(null);
    } catch (error) {
      console.error('Error al actualizar lista de servicios:', error);
      toast.error('Error al actualizar la lista de servicios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormCancel = () => {
    setCurrentView('list');
    setSelectedService(null);
  };

  const renderHeader = () => {
    const titles = {
      list: t('services.management') || 'Gestión de Servicios',
      create: t('services.newService') || 'Nuevo Servicio',
      edit: t('services.editService') || 'Editar Servicio',
      view: t('services.serviceDetails') || 'Detalles del Servicio',
      config: 'Configuración de Tipos de Servicio'
    };

    return (
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          {currentView !== 'list' && (
            <button
              onClick={() => setCurrentView('list')}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {titles[currentView]}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {currentView === 'list' && 'Registra y gestiona todos los servicios turísticos'}
              {currentView === 'create' && 'Registra una nueva solicitud de servicio'}
              {currentView === 'edit' && `Editando: ${selectedService?.code || selectedService?.name}`}
              {currentView === 'view' && selectedService?.code ? `Código: ${selectedService.code}` : 'Detalles del Servicio'}
              {currentView === 'config' && 'Configura los tipos de servicio disponibles'}
            </p>
          </div>
        </div>

        {/* Botones de acción - solo visible en vista de lista y para admin */}
        {currentView === 'list' && (user?.role === 'admin' || user?.role === 'administrator') && (
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentView('config')}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
            >
              <Cog6ToothIcon className="h-5 w-5 mr-2" />
              Configurar Tipos
            </button>
            <button
              onClick={handleCreateService}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              {t('services.newService') || 'Nuevo Servicio'}
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (currentView === 'config') {
      return <ServiceTypesSettings />;
    }

    return (
      <ServicesList
        onEdit={handleEditService}
        onDelete={handleDeleteService}
        onView={handleViewService}
        onCreate={handleCreateService}
        showFilters={false}
        compact={true}
        showHeader={false}
      />
    );
  };

  const renderModals = () => {
    return (
      <>
        {/* Modal de formulario */}
        {(currentView === 'create' || currentView === 'edit') && (
          <ServiceForm
            service={currentView === 'edit' ? selectedService : null}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            isLoading={isLoading}
          />
        )}

        {/* Modal de detalles */}
        {currentView === 'view' && selectedService && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <h2 className="text-2xl font-bold text-gray-900">Detalles del Servicio</h2>
                <button
                  type="button"
                  onClick={handleFormCancel}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Contenido scrolleable */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <ServiceDetails
                  service={selectedService}
                  onEdit={() => handleEditService(selectedService)}
                  onDelete={() => handleDeleteService(selectedService)}
                  userRole={user?.role}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación de eliminación */}
        {showDeleteModal && serviceToDelete && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Overlay */}
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              {/* Modal */}
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Eliminar Servicio
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        ¿Estás seguro de que deseas eliminar el servicio <span className="font-semibold text-gray-900">"{serviceToDelete.code || serviceToDelete.name}"</span>?
                        Esta acción cambiará el estado del servicio a inactivo.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Eliminar
                  </button>
                  <button
                    type="button"
                    onClick={cancelDelete}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de conflicto - No se puede eliminar por reservas activas */}
        {showConflictModal && conflictInfo && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Overlay */}
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              {/* Modal */}
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-amber-100 sm:mx-0 sm:h-10 sm:w-10">
                    <XCircleIcon className="h-6 w-6 text-amber-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      No se puede eliminar el servicio
                    </h3>
                    <div className="mt-3 space-y-3">
                      <p className="text-sm text-gray-600">
                        El servicio <span className="font-semibold text-gray-900">"{conflictInfo.serviceName}"</span> tiene
                        {conflictInfo.reservationCount
                          ? <span className="font-semibold text-amber-600"> {conflictInfo.reservationCount} reserva(s) activa(s)</span>
                          : <span className="font-semibold text-amber-600"> reservas activas</span>
                        } asociadas.
                      </p>
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-sm text-amber-800">
                          <strong>Para eliminar este servicio:</strong>
                        </p>
                        <ul className="mt-2 text-sm text-amber-700 list-disc list-inside space-y-1">
                          <li>Completa o cancela las reservas pendientes</li>
                          <li>Espera a que finalicen los tours programados</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    onClick={() => {
                      setShowConflictModal(false);
                      setConflictInfo(null);
                    }}
                    className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
                  >
                    Entendido
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      {renderHeader()}
      {renderContent()}
      {renderModals()}
    </div>
  );
};

// Componente para mostrar detalles del servicio
const ServiceDetails = ({ service, onEdit, onDelete, userRole }) => {
  if (!service) return null;

  const isAgency = userRole === 'agency';

  const formatCategory = (cat) => {
    if (!cat) return 'Sin categoría';
    return cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const langNames = {
    es: 'Español', en: 'Inglés', pt: 'Portugués',
    fr: 'Francés', de: 'Alemán', it: 'Italiano'
  };

  // Base URL del servidor (sin /api) para archivos estáticos
  const baseServerUrl = (import.meta.env.VITE_API_URL || 'http://localhost:4025/api').replace('/api', '');

  // Helper para construir URL de imagen
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads/')) return `${baseServerUrl}${imagePath}`;
    if (imagePath.startsWith('/')) return `${baseServerUrl}${imagePath}`;
    return `${baseServerUrl}/uploads/${imagePath}`;
  };

  return (
    <div className="space-y-6">
      {/* Información Básica */}
      <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center">
          <div className="w-1 h-6 bg-blue-500 rounded mr-3"></div>
          Información del Servicio
        </h3>

        {/* Header con imagen, nombre y precio */}
        <div className="flex items-start gap-5 mb-5 pb-5 border-b border-gray-200">
          {/* Imagen */}
          {service.image ? (
            <img
              src={getImageUrl(service.image)}
              alt={service.name}
              className="w-32 h-32 object-cover rounded-lg border border-gray-200 flex-shrink-0"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '';
                e.target.style.display = 'none';
                e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
              }}
            />
          ) : null}
          {!service.image && (
            <div className="w-32 h-32 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
              <PhotoIcon className="w-10 h-10 text-gray-400" />
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg">
                {formatCategory(service.category)}
              </span>
              {service.active !== false && (
                <span className="px-2.5 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-lg">
                  Activo
                </span>
              )}
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mt-2">{service.name || 'Sin nombre'}</h4>
            {(service.meetingPoint || service.meeting_point) && (
              <p className="flex items-center text-sm text-gray-500 mt-1">
                <MapPinIcon className="w-4 h-4 mr-1.5" />
                {service.meetingPoint || service.meeting_point}
              </p>
            )}
          </div>

          {/* Precio */}
          <div className="text-right bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 flex-shrink-0">
            <p className="text-xs text-gray-500 mb-1">Precio por persona</p>
            <p className="text-2xl font-bold text-gray-900">
              S/. {parseFloat(service.price || 0).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Grid de información */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Duración</label>
            <p className="text-sm font-medium text-gray-900 flex items-center">
              <ClockIcon className="w-4 h-4 mr-1.5 text-gray-400" />
              {service.duration || '-'} horas
            </p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Capacidad máxima</label>
            <p className="text-sm font-medium text-gray-900 flex items-center">
              <UsersIcon className="w-4 h-4 mr-1.5 text-gray-400" />
              {service.maxCapacity || service.max_capacity || '-'} personas
            </p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Idiomas disponibles</label>
            <p className="text-sm font-medium text-gray-900 flex items-center">
              <GlobeAltIcon className="w-4 h-4 mr-1.5 text-gray-400" />
              {Array.isArray(service.languages) && service.languages.length > 0
                ? service.languages.map(l => langNames[l] || l).join(', ')
                : '-'}
            </p>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Fecha de creación</label>
            <p className="text-sm font-medium text-gray-900 flex items-center">
              <CalendarDaysIcon className="w-4 h-4 mr-1.5 text-gray-400" />
              {service.createdAt ? new Date(service.createdAt).toLocaleDateString('es-ES') : '-'}
            </p>
          </div>
        </div>
      </div>

      {/* Descripción */}
      {service.description && (
        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-1 h-6 bg-indigo-500 rounded mr-3"></div>
            Descripción
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">{service.description}</p>
        </div>
      )}

      {/* Incluye / No Incluye */}
      {(service.includes?.length > 0 || service.excludes?.length > 0) && (
        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-5 flex items-center">
            <div className="w-1 h-6 bg-green-500 rounded mr-3"></div>
            Servicios Incluidos
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {service.includes?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <CheckCircleIcon className="w-4 h-4 mr-1.5 text-green-600" />
                  Incluye
                </h4>
                <ul className="space-y-2">
                  {service.includes.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600 bg-green-50 px-3 py-2 rounded-lg">
                      <span className="text-green-600 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {service.excludes?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <XCircleIcon className="w-4 h-4 mr-1.5 text-red-500" />
                  No Incluye
                </h4>
                <ul className="space-y-2">
                  {service.excludes.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600 bg-red-50 px-3 py-2 rounded-lg">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notas */}
      {service.notes && (
        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-xl border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <div className="w-1 h-6 bg-amber-500 rounded mr-3"></div>
            Notas Adicionales
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap bg-amber-50 px-4 py-3 rounded-lg border border-amber-200">
            {service.notes}
          </p>
        </div>
      )}

      {/* Footer con acciones */}
      {!isAgency && (
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 bg-gray-50 -mx-6 -mb-6 px-6 py-4 rounded-b-xl">
          <button
            onClick={onDelete}
            className="px-4 py-2.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors"
          >
            <TrashIcon className="w-4 h-4 inline mr-1.5" />
            Eliminar
          </button>
          <button
            onClick={onEdit}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PencilSquareIcon className="w-4 h-4 inline mr-1.5" />
            Editar Servicio
          </button>
        </div>
      )}
    </div>
  );
};

export default ServicesManagement;