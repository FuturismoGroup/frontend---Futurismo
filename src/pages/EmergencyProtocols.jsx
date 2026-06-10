import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, PlusIcon, ArrowDownTrayIcon, DocumentTextIcon, ShieldCheckIcon, ExclamationTriangleIcon, PhoneIcon, CheckCircleIcon, CogIcon, FunnelIcon, EyeIcon, PencilIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import useEmergencyStore from '../stores/emergencyStore';
import ProtocolViewer from '../components/emergency/ProtocolViewer';
import ProtocolEditor from '../components/emergency/ProtocolEditor';
import MaterialsManager from '../components/emergency/MaterialsManager';
import emergencyPDFService from '../services/emergencyPDFService';
import { useAuthStore } from '../stores/authStore';
import AdminEmergency from './AdminEmergency';
import { getIconDisplay } from '../utils/emergencyIcons';

const EmergencyProtocols = () => {
  const { user } = useAuthStore();

  // Si es administrador, mostrar panel administrativo
  if (user?.role === 'admin' || user?.role === 'administrator') {
    return <AdminEmergency />;
  }

  const protocols = useEmergencyStore((state) => state.protocols);
  const categories = useEmergencyStore((state) => state.categories);
  const fetchProtocols = useEmergencyStore((state) => state.fetchProtocols);
  const initialize = useEmergencyStore((state) => state.initialize);
  const updateProtocol = useEmergencyStore((state) => state.updateProtocol);
  const createProtocol = useEmergencyStore((state) => state.createProtocol);
  const deleteProtocol = useEmergencyStore((state) => state.deleteProtocol);

  // Estado para distinguir "lista vacia" de "fetch fallo".
  const [loadError, setLoadError] = useState(null);
  const [isLoadingProtocols, setIsLoadingProtocols] = useState(true);

  const loadData = async () => {
    try {
      setIsLoadingProtocols(true);
      setLoadError(null);
      await initialize();
      await fetchProtocols();
    } catch (error) {
      console.error('Error cargando protocolos:', error);
      const msg = error?.message || 'Error al cargar los protocolos';
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setIsLoadingProtocols(false);
    }
  };

  // Cargar protocolos al montar el componente
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialize, fetchProtocols]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showMaterials, setShowMaterials] = useState(false);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'list'

  // Filtrar protocolos
  // NOTA: El backend devuelve categoryId (UUID), no category como string
  const filteredProtocols = (protocols || []).filter(protocol => {
    const matchesSearch = !searchQuery ||
      protocol.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      protocol.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // Filtrar por categoryId (el backend usa UUIDs)
    const matchesCategory = !selectedCategory || protocol.categoryId === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleDownloadProtocol = async (protocol) => {
    try {
      await emergencyPDFService.downloadProtocolPDF(protocol);
    } catch (error) {
      console.error('Error descargando protocolo:', error);
      toast.error('Error al generar el PDF del protocolo');
    }
  };

  const handleDownloadAllProtocols = async () => {
    if (!filteredProtocols || filteredProtocols.length === 0) {
      toast('No hay protocolos para descargar', { icon: 'ℹ️' });
      return;
    }
    try {
      await emergencyPDFService.downloadAllProtocolsPDF(filteredProtocols);
    } catch (error) {
      console.error('Error descargando todos los protocolos:', error);
      toast.error('Error al generar el PDF de todos los protocolos');
    }
  };

  const handleDownloadGuideKit = async () => {
    try {
      await emergencyPDFService.downloadGuideEmergencyKit();
    } catch (error) {
      console.error('Error descargando kit de guía:', error);
      toast.error('Error al generar el PDF del kit de emergencia');
    }
  };

  // Obtener info de categoria por ID
  // El backend devuelve protocol.category como objeto o protocol.categoryId como UUID
  const getCategoryInfo = (protocol) => {
    // Si el backend ya incluye el objeto category completo, usarlo
    if (protocol.category && typeof protocol.category === 'object') {
      return {
        name: protocol.category.name || 'Sin categoría',
        icon: getIconDisplay(protocol.category.icon),
        color: protocol.category.color || '#6B7280',
        severityLevel: protocol.category.severityLevel
      };
    }
    // Fallback: buscar en la lista de categorías por categoryId
    const categoryId = protocol.categoryId || protocol.category;
    const found = categories.find(c => c.id === categoryId);
    if (found) {
      return {
        ...found,
        icon: getIconDisplay(found.icon)
      };
    }
    return {
      name: categoryId || 'Sin categoría',
      icon: '📋',
      color: '#6B7280'
    };
  };

  // Obtener color de prioridad basado en severityLevel de la categoria
  // severityLevel: 1 = alta (critical), 2 = media, 3+ = baja
  // O si hay priority directa en el protocolo (compatibilidad)
  const getPriorityColor = (priority) => {
    // Si es un numero (severityLevel), convertir
    if (typeof priority === 'number') {
      if (priority <= 1) return 'bg-red-100 text-red-800 border-red-200';
      if (priority === 2) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      return 'bg-green-100 text-green-800 border-green-200';
    }
    // Si es string (alta/media/baja), usar directo
    switch (priority) {
      case 'alta':
      case 'high':
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'media':
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baja':
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Obtener label de prioridad basado en severityLevel
  const getPriorityLabel = (protocol) => {
    const category = getCategoryInfo(protocol);
    const severity = category.severityLevel || protocol.priority;
    if (typeof severity === 'number') {
      if (severity <= 1) return 'ALTA';
      if (severity === 2) return 'MEDIA';
      return 'BAJA';
    }
    return severity?.toUpperCase() || 'N/A';
  };

  if (selectedProtocol && !isEditing) {
    return (
      <ProtocolViewer
        protocol={selectedProtocol}
        onClose={() => setSelectedProtocol(null)}
        onEdit={() => setIsEditing(true)}
        onDownload={() => handleDownloadProtocol(selectedProtocol)}
      />
    );
  }

  if (isEditing) {
    return (
      <ProtocolEditor
        protocol={selectedProtocol}
        onClose={() => {
          setIsEditing(false);
          setSelectedProtocol(null);
        }}
        onSave={(updatedProtocol) => {
          if (selectedProtocol) {
            updateProtocol(selectedProtocol.id, updatedProtocol);
          } else {
            createProtocol(updatedProtocol);
          }
          setIsEditing(false);
          setSelectedProtocol(null);
        }}
      />
    );
  }

  if (showMaterials) {
    return (
      <MaterialsManager
        isAdmin={user?.role === 'admin'}
      />
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4 sm:mb-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
            <ShieldCheckIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-red-500 flex-shrink-0" />
            <span className="truncate">Protocolos de Emergencia</span>
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1">
            Gestión de protocolos y materiales de emergencia para guías
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Boton de descarga: solo se muestra si HAY protocolos. */}
          {Array.isArray(filteredProtocols) && filteredProtocols.length > 0 && (
            <button
              onClick={handleDownloadAllProtocols}
              className="px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap"
              title="Descargar PDF con todos los protocolos"
            >
              <ArrowDownTrayIcon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate"><span className="hidden sm:inline">Descargar </span>Todos</span>
            </button>
          )}

          <button
            onClick={() => setShowMaterials(true)}
            className="px-3 sm:px-4 py-2 sm:py-2.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap"
          >
            <CogIcon className="w-4 h-4 flex-shrink-0" />
            <span>Materiales</span>
          </button>

          {user?.role === 'admin' && (
            <button
              onClick={() => setIsEditing(true)}
              className="col-span-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm whitespace-nowrap"
            >
              <PlusIcon className="w-4 h-4 flex-shrink-0" />
              <span><span className="hidden sm:inline">Nuevo </span>Protocolo</span>
            </button>
          )}
        </div>
      </div>

      {/* Filtros y búsqueda */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          {/* Búsqueda */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar protocolos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 sm:py-2.5 w-full text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Filtro por categoria - usa category.id (UUID) */}
          <div className="flex items-center gap-2 min-w-0">
            <FunnelIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 sm:py-2.5 text-sm sm:text-base flex-1 min-w-0 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las categorías</option>
              {(categories || []).map(category => (
                <option key={category.id} value={category.id}>
                  {getIconDisplay(category.icon)} {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Vista */}
          <div className="flex items-center justify-end space-x-1 border border-gray-300 rounded-lg p-1 flex-shrink-0">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-2 rounded ${viewMode === 'cards' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
              </div>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              <div className="w-4 h-4 space-y-1">
                <div className="bg-current h-0.5 rounded"></div>
                <div className="bg-current h-0.5 rounded"></div>
                <div className="bg-current h-0.5 rounded"></div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Lista de protocolos */}
      {isLoadingProtocols ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ArrowPathIcon className="mx-auto h-10 w-10 text-gray-400 animate-spin" />
          <p className="mt-3 text-sm text-gray-500">Cargando protocolos...</p>
        </div>
      ) : loadError ? (
        <div className="text-center py-12 bg-red-50 border border-red-200 rounded-lg">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
          <h3 className="mt-2 text-sm font-medium text-red-900">
            No se pudieron cargar los protocolos
          </h3>
          <p className="mt-1 text-sm text-red-700">{loadError}</p>
          <button
            onClick={loadData}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Reintentar
          </button>
        </div>
      ) : filteredProtocols.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {(protocols && protocols.length > 0) ? 'Ningun protocolo coincide con los filtros' : 'Aun no hay protocolos creados'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {(protocols && protocols.length > 0)
              ? 'Limpia el buscador o cambia el filtro de categoria.'
              : 'Cuando un administrador cree protocolos de emergencia, apareceran aqui.'}
          </p>
          {(searchQuery || selectedCategory) && (
            <button
              onClick={() => { setSearchQuery(''); setSelectedCategory(''); }}
              className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {filteredProtocols.map(protocol => {
            const category = getCategoryInfo(protocol);
            const priorityLabel = getPriorityLabel(protocol);
            const severityLevel = category.severityLevel || protocol.priority;
            // El backend devuelve steps directamente, no content.steps
            const stepsCount = protocol.steps?.length || protocol.stepsCount || 0;
            // updatedAt viene del backend, no lastUpdated
            const lastUpdated = protocol.updatedAt || protocol.lastUpdated;
            return (
              <div
                key={protocol.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-3 sm:p-4 lg:p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="flex items-start gap-2 sm:gap-3 min-w-0 flex-1">
                      <div
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center text-xl sm:text-2xl flex-shrink-0"
                        style={{ backgroundColor: (category.color || '#6B7280') + '20' }}
                      >
                        {getIconDisplay(category.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-2 break-words">
                          {protocol.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-xs sm:text-sm text-gray-600 truncate">{category.name}</span>
                          <span
                            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium rounded-full border ${getPriorityColor(severityLevel)}`}
                          >
                            {priorityLabel}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Descripcion */}
                  <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 line-clamp-3 break-words">
                    {protocol.description || 'Sin descripcion'}
                  </p>

                  {/* Informacion adicional */}
                  <div className="flex items-center justify-between gap-2 text-[10px] sm:text-xs text-gray-500 mb-3 sm:mb-4 flex-wrap">
                    <span className="truncate">Actualizado: {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'N/A'}</span>
                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                      <span className="flex items-center">
                        <CheckCircleIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                        {stepsCount} pasos
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      onClick={() => setSelectedProtocol(protocol)}
                      className="flex-1 px-2 sm:px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                    >
                      <EyeIcon className="w-4 h-4 flex-shrink-0" />
                      <span>Ver</span>
                    </button>

                    <button
                      onClick={() => handleDownloadProtocol(protocol)}
                      className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex-shrink-0"
                      title="Descargar PDF"
                      aria-label="Descargar PDF"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                    </button>

                    {user?.role === 'admin' && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedProtocol(protocol);
                            setIsEditing(true);
                          }}
                          className="p-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex-shrink-0"
                          title="Editar"
                          aria-label="Editar"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            if (confirm('¿Estás seguro de eliminar este protocolo?')) {
                              deleteProtocol(protocol.id);
                            }
                          }}
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex-shrink-0"
                          title="Eliminar"
                          aria-label="Eliminar"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Protocolo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actualizado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProtocols.map(protocol => {
                  const category = getCategoryInfo(protocol);
                  const priorityLabel = getPriorityLabel(protocol);
                  const severityLevel = category.severityLevel || protocol.priority;
                  const lastUpdated = protocol.updatedAt || protocol.lastUpdated;
                  return (
                    <tr key={protocol.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{getIconDisplay(category.icon)}</span>
                          <div>
                            <div className="font-medium text-gray-900">{protocol.title}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">{protocol.description || 'Sin descripcion'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span>{getIconDisplay(category.icon)}</span>
                          <span className="text-sm text-gray-900">{category.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(severityLevel)}`}
                        >
                          {priorityLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {lastUpdated ? new Date(lastUpdated).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedProtocol(protocol)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver protocolo"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleDownloadProtocol(protocol)}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Descargar PDF"
                          >
                            <ArrowDownTrayIcon className="w-4 h-4" />
                          </button>
                          
                          {user?.role === 'admin' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedProtocol(protocol);
                                  setIsEditing(true);
                                }}
                                className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
                                title="Editar protocolo"
                              >
                                <PencilIcon className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => {
                                  if (confirm('¿Estás seguro de eliminar este protocolo?')) {
                                    deleteProtocol(protocol.id);
                                  }
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Eliminar protocolo"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmergencyProtocols;