import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserGroupIcon, MagnifyingGlassIcon, FunnelIcon, PencilIcon, EyeIcon, TrashIcon, GlobeAltIcon, TrophyIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, InformationCircleIcon, Squares2X2Icon, TableCellsIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import useGuidesStore from '../stores/guidesStore';
import GuideForm from '../components/guides/GuideForm';
import GuideProfile from '../components/guides/GuideProfile';
import LanguagesSettings from '../components/settings/LanguagesSettings';
import { getLanguageName } from '../config/languages';

const GuidesManagement = () => {
  const { t } = useTranslation();
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12; // múltiplo de 1/2/3 columnas para llenar filas completas

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

  // Paginación (lado cliente): evita renderizar todas las guías a la vez
  const totalPages = Math.max(1, Math.ceil(filteredGuides.length / itemsPerPage));

  // Volver a la primera página cuando cambian los filtros o la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, filterMuseum]);

  // Mantener la página dentro de rango (p. ej. tras eliminar una guía)
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedGuides = filteredGuides.slice(startIndex, startIndex + itemsPerPage);

  const handleEditGuide = (guide) => {
    setEditingGuide(guide);
    setIsEditing(true);
  };

  const handleViewProfile = (guide) => {
    setSelectedGuide(guide);
    setViewMode('profile');
  };

  const handleDeleteGuide = (guideId) => {
    if (confirm(t('guidesManagement.confirmDelete'))) {
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
        alert(t('guidesManagement.updateError'));
      }
    }
  };

  const getMuseumLabel = (museum) => {
    if (typeof museum === 'object') return museum.name || t('guidesManagement.museumNoName');
    return museum || t('guidesManagement.museumNoName');
  };

  const getLevelBadge = (level) => {
    const levels = {
      'principiante': { color: 'bg-yellow-100 text-yellow-800', text: t('guidesManagement.levels.principiante') },
      'intermedio': { color: 'bg-blue-100 text-blue-800', text: t('guidesManagement.levels.intermedio') },
      'avanzado': { color: 'bg-green-100 text-green-800', text: t('guidesManagement.levels.avanzado') },
      'experto': { color: 'bg-purple-100 text-purple-800', text: t('guidesManagement.levels.experto') },
      'nativo': { color: 'bg-indigo-100 text-indigo-800', text: t('guidesManagement.levels.nativo') }
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
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">{t('guidesManagement.guideProfile')}</h2>
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
    <div className="w-full">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3 sm:mb-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
              <UserGroupIcon className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-blue-500 flex-shrink-0" />
              <span className="truncate">{t('guidesManagement.title')}</span>
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-gray-600 mt-1">
              {t('guidesManagement.subtitle')}
            </p>
          </div>
          <button
            onClick={() => setShowLanguagesSettings(true)}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm whitespace-nowrap flex-shrink-0"
            title={t('guidesManagement.configureLanguagesTitle')}
          >
            <Cog6ToothIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">{t('guidesManagement.configureLanguages')}</span>
            <span className="sm:hidden">{t('guidesManagement.languages')}</span>
          </button>
        </div>

        {/* Mensaje informativo */}
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 sm:p-4 rounded">
          <div className="flex items-start gap-2 sm:gap-3">
            <InformationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs sm:text-sm text-blue-800 font-medium">
                {t('guidesManagement.infoCreateAt')} <strong>{t('guidesManagement.users')}</strong>
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {t('guidesManagement.infoCreateExplanation')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">{t('guidesManagement.summaryTitle')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <UserGroupIcon className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{guides.length}</p>
                <p className="text-xs sm:text-sm text-blue-700 truncate">{t('guidesManagement.totalGuides')}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <TrophyIcon className="w-7 h-7 sm:w-8 sm:h-8 text-green-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-green-600">{guides.filter(g => g.type === 'planta' || g.guideType === 'AGENCY' || g.guide_type === 'AGENCY').length}</p>
                <p className="text-xs sm:text-sm text-green-700 truncate">{t('guidesManagement.agencyGuides')}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <GlobeAltIcon className="w-7 h-7 sm:w-8 sm:h-8 text-yellow-600 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xl sm:text-2xl font-bold text-yellow-600">{guides.filter(g => g.type === 'freelance' || g.guideType === 'FREELANCE' || g.guide_type === 'FREELANCE').length}</p>
                <p className="text-xs sm:text-sm text-yellow-700 truncate">{t('guidesManagement.freelanceGuides')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
          <div className="flex-1 min-w-0">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <input
                type="text"
                placeholder={t('guidesManagement.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 sm:py-2.5 w-full text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <FunnelIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 sm:py-2.5 text-sm sm:text-base flex-1 min-w-0 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('guidesManagement.allTypes')}</option>
                <option value="planta">{t('guidesManagement.agencyGuide')}</option>
                <option value="freelance">{t('guidesManagement.freelance')}</option>
              </select>
            </div>

            <input
              type="text"
              placeholder={t('guidesManagement.searchMuseumPlaceholder')}
              value={filterMuseum}
              onChange={(e) => setFilterMuseum(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 sm:py-2.5 text-sm sm:text-base outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
            />
          </div>
        </div>
      </div>

      {/* Selector de vista */}
      <div className="flex justify-end mb-3 sm:mb-4">
        <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md flex items-center gap-1.5 sm:gap-2 transition-colors text-xs sm:text-sm ${
              viewMode === 'grid'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Squares2X2Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('guidesManagement.grid')}</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-md flex items-center gap-1.5 sm:gap-2 transition-colors text-xs sm:text-sm ${
              viewMode === 'list'
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <TableCellsIcon className="w-4 h-4" />
            <span className="hidden sm:inline">{t('guidesManagement.list')}</span>
          </button>
        </div>
      </div>

      {/* Lista de guías */}
      {filteredGuides.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {t('guidesManagement.notFoundTitle')}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('guidesManagement.notFoundSubtitle')}
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
                    {t('guidesManagement.table.guide')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('guidesManagement.table.type')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('guidesManagement.table.contact')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('guidesManagement.table.languagesCol')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('guidesManagement.table.rating')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('guidesManagement.table.certifications')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('guidesManagement.table.experience')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('guidesManagement.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedGuides.map(guide => (
                  <tr key={guide.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                            {(guide?.name || guide?.fullName || 'G').split(' ').map(name => name[0]).join('').substring(0, 2)}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{guide?.name || guide?.fullName || t('guidesManagement.noName')}</div>
                          <div className="text-sm text-gray-500">{guide?.email || t('guidesManagement.noEmail')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        (guide?.type === 'planta' || guide?.guideType === 'AGENCY' || guide?.guide_type === 'AGENCY')
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {(guide?.type === 'planta' || guide?.guideType === 'AGENCY' || guide?.guide_type === 'AGENCY') ? t('guidesManagement.agency') : t('guidesManagement.freelance')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{guide?.phone || t('guidesManagement.noPhone')}</div>
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
                      {guide?.yearsOfExperience || guide?.years_of_experience || 0} {t('guidesManagement.yearsAbbr')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewProfile(guide)}
                          className="text-blue-600 hover:text-blue-900"
                          title={t('guidesManagement.viewProfile')}
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        {guide.guideType !== 'FREELANCE' && guide.type !== 'freelance' && (
                          <>
                            <button
                              onClick={() => handleEditGuide(guide)}
                              className="text-yellow-600 hover:text-yellow-900"
                              title={t('guidesManagement.edit')}
                            >
                              <PencilIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteGuide(guide.id)}
                              className="text-red-600 hover:text-red-900"
                              title={t('guidesManagement.delete')}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {paginatedGuides.map(guide => (
            <div
              key={guide.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 h-full"
            >
              <div className="p-4 sm:p-5 lg:p-6 h-full flex flex-col">
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
                        {guide?.name || guide?.fullName || t('guidesManagement.noName')}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          (guide?.type === 'planta' || guide?.guideType === 'AGENCY' || guide?.guide_type === 'AGENCY')
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {(guide?.type === 'planta' || guide?.guideType === 'AGENCY' || guide?.guide_type === 'AGENCY') ? t('guidesManagement.agency') : t('guidesManagement.freelance')}
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
                    <span className="truncate">{guide?.email || t('guidesManagement.noEmail')}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <PhoneIcon className="w-4 h-4" />
                    <span>{guide?.phone || t('guidesManagement.noPhone')}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <MapPinIcon className="w-4 h-4" />
                    <span className="truncate">{guide?.address || t('guidesManagement.noAddress')}</span>
                  </div>
                </div>

                {/* Idiomas */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {t('guidesManagement.languagesCount', { count: guide?.languages?.length || 0 })}
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
                        {t('guidesManagement.moreCount', { count: guide.languages.length - 3 })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Museos */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {t('guidesManagement.museumsCount', { count: guide?.museums?.length || 0 })}
                  </h4>
                  <div className="space-y-1">
                    {(guide?.museums || []).slice(0, 2).map((museum, index) => {
                      const name = typeof museum === 'object' ? museum.name : museum;
                      const expertise = typeof museum === 'object' ? museum.expertise : null;
                      return (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 truncate">{name || t('guidesManagement.museumNoName')}</span>
                          {expertise && getLevelBadge(expertise)}
                        </div>
                      );
                    })}
                    {(guide?.museums?.length || 0) > 2 && (
                      <span className="text-xs text-gray-500">
                        {t('guidesManagement.moreCount', { count: guide.museums.length - 2 })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-3 gap-3 mb-4 text-center">
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-lg font-semibold text-gray-900">{parseFloat(guide?.rating) || 0}</p>
                    <p className="text-xs text-gray-600">{t('guidesManagement.ratingLabel')}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-lg font-semibold text-gray-900">{guide?.yearsOfExperience || guide?.years_of_experience || 0}</p>
                    <p className="text-xs text-gray-600">{t('guidesManagement.yearsLabel')}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-lg font-semibold text-gray-900">{Array.isArray(guide?.certifications) ? guide.certifications.length : 0}</p>
                    <p className="text-xs text-gray-600">{t('guidesManagement.certLabel')}</p>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center space-x-2 mt-auto pt-2">
                  <button
                    onClick={() => handleViewProfile(guide)}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
                  >
                    <EyeIcon className="w-4 h-4" />
                    <span>{t('guidesManagement.viewProfileBtn')}</span>
                  </button>

                  {guide.guideType !== 'FREELANCE' && guide.type !== 'freelance' && (
                    <>
                      <button
                        onClick={() => handleEditGuide(guide)}
                        className="px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
                        title={t('guidesManagement.editGuideTitle')}
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteGuide(guide.id)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        title={t('guidesManagement.deleteGuideTitle')}
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

      {/* Paginación */}
      {filteredGuides.length > 0 && totalPages > 1 && (
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white rounded-lg border border-gray-200 shadow-sm px-4 py-3">
          <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
            {t('guidesManagement.pagination.showing', {
              from: startIndex + 1,
              to: Math.min(startIndex + itemsPerPage, filteredGuides.length),
              total: filteredGuides.length
            })}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              {t('guidesManagement.pagination.previous')}
            </button>
            <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">
              {t('guidesManagement.pagination.page', { current: currentPage, total: totalPages })}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              {t('guidesManagement.pagination.next')}
            </button>
          </div>
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
