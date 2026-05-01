import { useState, useEffect } from 'react';
import { UserGroupIcon, MagnifyingGlassIcon, FunnelIcon, PencilIcon, EyeIcon, TrashIcon, GlobeAltIcon, TrophyIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, InformationCircleIcon, Squares2X2Icon, TableCellsIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import useGuidesStore from '../stores/guidesStore';
import GuideForm from '../components/guides/GuideForm';
import GuideProfile from '../components/guides/GuideProfile';
import LanguagesSettings from '../components/settings/LanguagesSettings';
import { getLanguageName } from '../config/languages';

const GuidesManagement = () => {
  const { guides = [], fetchGuides, updateGuide, deleteGuide, isLoading } = useGuidesStore();

  // Cargar guías al montar el componente
  useEffect(() => {
    fetchGuides();
  }, [fetchGuides]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterMuseum, setFilterMuseum] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingGuide, setEditingGuide] = useState(null);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // grid, list, profile
  const [showLanguagesSettings, setShowLanguagesSettings] = useState(false);

  // Filtrar guías
  const filteredGuides = guides.filter(guide => {
    const matchesSearch = !searchQuery ||
      guide?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide?.last_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guide?.documents?.dni?.includes(searchQuery) ||
      guide?.dni?.includes(searchQuery);

    // Normalizar tipo de guía para filtro
    const guideTypeValue = guide?.type ||
      (guide?.guideType === 'AGENCY' || guide?.guide_type === 'AGENCY' ? 'planta' : 'freelance');
    const matchesType = !filterType || guideTypeValue === filterType;

    const guideMuseums = guide?.museums || [];
    const matchesMuseum = !filterMuseum ||
      guideMuseums.some(museum => {
        const name = typeof museum === 'object' ? museum.name : museum;
        return name?.toLowerCase().includes(filterMuseum.toLowerCase());
      });

    return matchesSearch && matchesType && matchesMuseum;
  });

  const handleEditGuide = (guide) => {
    setEditingGuide(guide);
    setIsEditing(true);
  };

  const handleViewProfile = (guide) => {
    setSelectedGuide(guide);
    setViewMode('profile');
  };

  const handleDeleteGuide = (guideId) => {
    if (confirm('¿Estás seguro de eliminar este guía?')) {
      deleteGuide(guideId);
    }
  };

  const handleSaveGuide = async (guideData) => {
    // Solo permite edición, no creación
    if (editingGuide) {
      try {
        await updateGuide(editingGuide.id, guideData);
        setIsEditing(false);
        setEditingGuide(null);
        // Recargar guías para ver los cambios
        await fetchGuides();
      } catch (error) {
        console.error('Error al actualizar guía:', error);
        alert('Error al actualizar la información del guía');
      }
    }
  };

  const getMuseumLabel = (museum) => {
    if (typeof museum === 'object') return museum.name || 'Museo sin nombre';
    return museum || 'Museo sin nombre';
  };

  const getLevelBadge = (level) => {
    const levels = {
      'principiante': { color: 'bg-yellow-100 text-yellow-800', text: 'Principiante' },
      'intermedio': { color: 'bg-blue-100 text-blue-800', text: 'Intermedio' },
      'avanzado': { color: 'bg-green-100 text-green-800', text: 'Avanzado' },
      'experto': { color: 'bg-purple-100 text-purple-800', text: 'Experto' },
      'nativo': { color: 'bg-indigo-100 text-indigo-800', text: 'Nativo' }
    };

    const levelInfo = levels[level] || { color: 'bg-gray-100 text-gray-800', text: level };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${levelInfo.color}`}>
        {levelInfo.text}
      </span>
    );
  };

  const renderModals = () => {
    return (
      <>
        {/* Modal de perfil de guía */}
        {viewMode === 'profile' && selectedGuide && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-[1200px] sm:rounded-lg shadow-xl flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Perfil del Guía</h2>
                <button
                  type="button"
                  onClick={() => {
                    setViewMode('grid');
                    setSelectedGuide(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-2 -mr-2"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6">
                <GuideProfile
                  guide={selectedGuide}
                  onClose={() => {
                    setViewMode('grid');
                    setSelectedGuide(null);
                  }}
                  onEdit={handleEditGuide}
                />
              </div>
            </div>
          </div>
        )}

        {/* Modal de formulario de guía - SOLO para edición */}
        {isEditing && editingGuide && (
          <GuideForm
            guide={editingGuide}
            onSave={handleSaveGuide}
            onCancel={() => {
              setIsEditing(false);
              setEditingGuide(null);
            }}
          />
        )}
      </>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <UserGroupIcon className="w-8 h-8 mr-3 text-blue-500" />
              Gestión de Guías
            </h1>
            <p className="text-gray-600 mt-1">
              Visualiza y administra la información de guías registrados
            </p>
          </div>
          <button
            onClick={() => setShowLanguagesSettings(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            title="Configurar idiomas disponibles"
          >
            <Cog6ToothIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Configurar Idiomas</span>
          </button>
        </div>

        {/* Mensaje informativo */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
          <div className="flex items-start">
            <InformationCircleIcon className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-blue-800 font-medium">
                Para crear nuevos guías, dirígete a la sección de <strong>Usuarios</strong>
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Los guías necesitan credenciales de acceso al sistema, por lo que deben ser creados desde el módulo de Usuarios con el rol de "Guía".
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Resumen de Guías</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <UserGroupIcon className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{guides.length}</p>
                <p className="text-sm text-blue-700">Total Guías</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <TrophyIcon className="w-8 h-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{guides.filter(g => g.type === 'planta' || g.guideType === 'AGENCY' || g.guide_type === 'AGENCY').length}</p>
                <p className="text-sm text-green-700">Guías de Planta</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center space-x-3">
              <GlobeAltIcon className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold text-yellow-600">{guides.filter(g => g.type === 'freelance' || g.guideType === 'FREELANCE' || g.guide_type === 'FREELANCE').length}</p>
                <p className="text-sm text-yellow-700">Freelance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar por nombre, email o DNI..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-4 h-4 text-gray-500" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Todos los tipos</option>
                <option value="planta">Guía de Planta</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>

            <input
              type="text"
              placeholder="Buscar por museo..."
              value={filterMuseum}
              onChange={(e) => setFilterMuseum(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Selector de vista */}
      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Squares2X2Icon className="w-4 h-4" />
            <span>Cuadrícula</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-md flex items-center space-x-2 transition-colors ${
              viewMode === 'list'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <TableCellsIcon className="w-4 h-4" />
            <span>Lista</span>
          </button>
        </div>
      </div>

      {/* Lista de guías */}
      {filteredGuides.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No se encontraron guías
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Ajusta los filtros de búsqueda o crea guías desde la sección de Usuarios.
          </p>
        </div>
      ) : viewMode === 'list' ? (
        /* Vista de Lista/Tabla */
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guía
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Idiomas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cert.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Experiencia
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredGuides.map(guide => (
                  <tr key={guide.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                            {(guide?.name || guide?.fullName || 'G').split(' ').map(name => name[0]).join('').substring(0, 2)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{guide?.name || guide?.fullName || 'Sin nombre'}</div>
                          <div className="text-sm text-gray-500">{guide?.email || 'Sin email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        (guide?.type === 'planta' || guide?.guideType === 'AGENCY' || guide?.guide_type === 'AGENCY')
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {(guide?.type === 'planta' || guide?.guideType === 'AGENCY' || guide?.guide_type === 'AGENCY') ? 'Planta' : 'Freelance'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{guide?.phone || 'Sin teléfono'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {(guide?.languages || []).slice(0, 2).map((lang, idx) => {
                          const code = typeof lang === 'object' ? lang.code : lang;
                          return (
                            <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              {(code || '').toUpperCase()}
                            </span>
                          );
                        })}
                        {(guide?.languages?.length || 0) > 2 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            +{guide.languages.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <TrophyIcon className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="text-sm text-gray-900">{parseFloat(guide?.rating) || 0}/5</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {Array.isArray(guide?.certifications) ? guide.certifications.length : 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {guide?.yearsOfExperience || guide?.years_of_experience || 0} años
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewProfile(guide)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver perfil"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        {guide.guideType !== 'FREELANCE' && guide.type !== 'freelance' && (
                          <>
                            <button
                              onClick={() => handleEditGuide(guide)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title="Editar"
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteGuide(guide.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Eliminar"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Vista de Grid/Cuadrícula */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuides.map(guide => (
            <div
              key={guide.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div className="p-6">
                {/* Header del guía */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-lg"
                    >
                      {(guide?.name || guide?.fullName || 'G').split(' ').map(name => name[0]).join('').substring(0, 2)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">
                        {guide?.name || guide?.fullName || 'Sin nombre'}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          (guide?.type === 'planta' || guide?.guideType === 'AGENCY' || guide?.guide_type === 'AGENCY')
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {(guide?.type === 'planta' || guide?.guideType === 'AGENCY' || guide?.guide_type === 'AGENCY') ? 'Planta' : 'Freelance'}
                        </span>
                        <div className="flex items-center space-x-1">
                          <TrophyIcon className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs text-gray-600">{parseFloat(guide?.rating) || 0}/5</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información de contacto */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <EnvelopeIcon className="w-4 h-4" />
                    <span className="truncate">{guide?.email || 'Sin email'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <PhoneIcon className="w-4 h-4" />
                    <span>{guide?.phone || 'Sin teléfono'}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPinIcon className="w-4 h-4" />
                    <span className="truncate">{guide?.address || 'Sin dirección'}</span>
                  </div>
                </div>

                {/* Idiomas */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Idiomas ({guide?.languages?.length || 0})
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {(guide?.languages || []).slice(0, 3).map((lang, index) => {
                      const code = typeof lang === 'object' ? lang.code : lang;
                      const level = typeof lang === 'object' ? lang.level : null;
                      return (
                        <div key={index} className="flex items-center space-x-1 bg-blue-50 px-2 py-1 rounded text-xs">
                          <span>{getLanguageName(code)}</span>
                          {level && getLevelBadge(level)}
                        </div>
                      );
                    })}
                    {(guide?.languages?.length || 0) > 3 && (
                      <span className="text-xs text-gray-500 px-2 py-1">
                        +{guide.languages.length - 3} más
                      </span>
                    )}
                  </div>
                </div>

                {/* Museos */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Museos ({guide?.museums?.length || 0})
                  </h4>
                  <div className="space-y-1">
                    {(guide?.museums || []).slice(0, 2).map((museum, index) => {
                      const name = typeof museum === 'object' ? museum.name : museum;
                      const expertise = typeof museum === 'object' ? museum.expertise : null;
                      return (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 truncate">{name || 'Museo sin nombre'}</span>
                          {expertise && getLevelBadge(expertise)}
                        </div>
                      );
                    })}
                    {(guide?.museums?.length || 0) > 2 && (
                      <span className="text-xs text-gray-500">
                        +{guide.museums.length - 2} más
                      </span>
                    )}
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-lg font-semibold text-gray-900">{parseFloat(guide?.rating) || 0}</p>
                    <p className="text-xs text-gray-600">Rating</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-lg font-semibold text-gray-900">{guide?.yearsOfExperience || guide?.years_of_experience || 0}</p>
                    <p className="text-xs text-gray-600">Años</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-lg font-semibold text-gray-900">{Array.isArray(guide?.certifications) ? guide.certifications.length : 0}</p>
                    <p className="text-xs text-gray-600">Cert.</p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleViewProfile(guide)}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <EyeIcon className="w-4 h-4" />
                    <span>Ver Perfil</span>
                  </button>

                  {guide.guideType !== 'FREELANCE' && guide.type !== 'freelance' && (
                    <>
                      <button
                        onClick={() => handleEditGuide(guide)}
                        className="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                        title="Editar guía"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteGuide(guide.id)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        title="Eliminar guía"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {renderModals()}

      {/* Modal de configuración de idiomas */}
      <LanguagesSettings
        isOpen={showLanguagesSettings}
        onClose={() => setShowLanguagesSettings(false)}
      />
    </div>
  );
};

export default GuidesManagement;
