import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Squares2X2Icon,
  ListBulletIcon,
  SparklesIcon,
  UserGroupIcon,
  StarIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  LanguageIcon,
  AcademicCapIcon,
  ClockIcon,
  CheckBadgeIcon,
  ChevronUpDownIcon
} from '@heroicons/react/24/outline';
import useMarketplaceStore from '../../stores/marketplaceStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { resolveFileUrl } from '../../utils/fileUrl';

const getLanguageName = (lang, t) => {
  if (!lang) return '';
  if (typeof lang === 'object') {
    const code = lang.code || lang.name || lang.language || '';
    return t(`languageNames.${code.toLowerCase()}`, code);
  }
  const code = lang.toLowerCase();
  return t(`languageNames.${code}`, lang);
};

const GuidesMarketplace = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const SORT_OPTIONS = [
    { value: 'rating', label: t('marketplace.sortOptions.bestRating') },
    { value: 'name', label: t('marketplace.sortOptions.alphabetical') },
    { value: 'price-asc', label: t('marketplace.sortOptions.priceLowToHigh') },
    { value: 'price-desc', label: t('marketplace.sortOptions.priceHighToLow') },
    { value: 'experience', label: t('marketplace.sortOptions.mostExperience') },
    { value: 'recent', label: t('marketplace.sortOptions.mostRecent') }
  ];

  const {
    freelanceGuides,
    isLoading,
    fetchFreelanceGuides,
    setFilters,
    setSortBy,
    sortBy,
    activeFilters
  } = useMarketplaceStore();

  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [viewLayout, setViewLayout] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    try {
      await fetchFreelanceGuides();
    } catch (error) {
      console.error('Error loading guides:', error);
    }
  };

  // Filtrar guías localmente
  const filteredGuides = freelanceGuides.filter(guide => {
    if (!localSearchQuery) return true;

    const query = localSearchQuery.toLowerCase();

    const nameMatch =
      guide?.name?.toLowerCase().includes(query) ||
      guide?.fullName?.toLowerCase().includes(query) ||
      guide?.firstName?.toLowerCase().includes(query) ||
      guide?.lastName?.toLowerCase().includes(query);

    const specialtiesMatch = Array.isArray(guide?.specialties) &&
      guide.specialties.some(s => {
        const specName = typeof s === 'object' ? (s.name || s.specialty || '') : s;
        return specName.toLowerCase().includes(query);
      });

    const languagesMatch = Array.isArray(guide?.languages) &&
      guide.languages.some(l => {
        const langName = typeof l === 'object' ? (l.name || l.language || '') : l;
        return langName.toLowerCase().includes(query);
      });

    const bioMatch = guide?.bio?.toLowerCase().includes(query);
    const educationMatch = guide?.education?.toLowerCase().includes(query);

    return nameMatch || specialtiesMatch || languagesMatch || bioMatch || educationMatch;
  });

  const handleSearchChange = (e) => {
    setLocalSearchQuery(e.target.value);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters({ [filterType]: value });
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  // Estadísticas calculadas de los guías
  const stats = {
    totalGuides: filteredGuides.length,
    availableGuides: filteredGuides.filter(g => g.status === 'available' || g.online).length,
    averageRating: filteredGuides.length > 0
      ? (filteredGuides.reduce((sum, g) => sum + parseFloat(g.rating || 0), 0) / filteredGuides.length).toFixed(1)
      : '0.0',
    totalReviews: filteredGuides.reduce((sum, g) => sum + (g.reviewCount || g.reviewsCount || 0), 0)
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <SparklesIcon className="w-8 h-8 mr-3 text-blue-500" />
            Marketplace de Guías
          </h1>
          <p className="text-gray-600 mt-1">
            Encuentra y contrata guías freelance especializados
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewLayout('grid')}
            className={`p-2 rounded-lg transition-colors ${viewLayout === 'grid'
              ? 'bg-blue-100 text-blue-600'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            title="Vista cuadrícula"
          >
            <Squares2X2Icon className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewLayout('list')}
            className={`p-2 rounded-lg transition-colors ${viewLayout === 'list'
              ? 'bg-blue-100 text-blue-600'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
            title="Vista lista"
          >
            <ListBulletIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <UserGroupIcon className="w-8 h-8 text-blue-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Guías</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalGuides}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <SparklesIcon className="w-8 h-8 text-green-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Disponibles</p>
              <p className="text-2xl font-bold text-gray-900">{stats.availableGuides}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <StarIcon className="w-8 h-8 text-yellow-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Rating Promedio</p>
              <p className="text-2xl font-bold text-gray-900">{stats.averageRating}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <CurrencyDollarIcon className="w-8 h-8 text-purple-500" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Reviews</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReviews}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search, Sort and Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:gap-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('marketplace.messages.searchPlaceholder')}
                value={localSearchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Sort dropdown */}
            <div className="relative">
              <ChevronUpDownIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
              <select
                value={sortBy}
                onChange={handleSortChange}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none cursor-pointer"
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Filters toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="w-4 h-4" />
              <span>Filtros</span>
            </button>

            {/* Availability filter */}
            <select
              value={activeFilters.availability?.toString() || ''}
              onChange={(e) => handleFilterChange('availability', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Todos los guías</option>
              <option value="available">Solo disponibles</option>
              <option value="busy">Ocupados</option>
            </select>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Idiomas
                </label>
                <select
                  value={typeof activeFilters.languages === 'string' ? activeFilters.languages : ''}
                  onChange={(e) => handleFilterChange('languages', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Todos los idiomas</option>
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                  <option value="pt">Portugués</option>
                  <option value="fr">Francés</option>
                  <option value="de">Alemán</option>
                  <option value="it">Italiano</option>
                  <option value="ja">Japonés</option>
                  <option value="zh">Chino</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Especialidad
                </label>
                <select
                  value={typeof activeFilters.tourTypes === 'string' ? activeFilters.tourTypes : ''}
                  onChange={(e) => handleFilterChange('tourTypes', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Todas las especialidades</option>
                  <option value="Cultural">{t('guides.specialties.cultural')}</option>
                  <option value="Histórico">{t('guides.specialties.historical')}</option>
                  <option value="Aventura">{t('guides.specialties.adventure')}</option>
                  <option value="Gastronómico">{t('guides.specialties.gastronomic')}</option>
                  <option value="Naturaleza">{t('guides.specialties.ecological')}</option>
                  <option value="Arqueológico">{t('guides.specialties.archaeological')}</option>
                  <option value="Religioso">{t('guides.specialties.religious')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rating Mínimo
                </label>
                <select
                  value={activeFilters.minRating?.toString() || ''}
                  onChange={(e) => handleFilterChange('minRating', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Cualquier rating</option>
                  <option value="4.5">4.5+ estrellas</option>
                  <option value="4.0">4.0+ estrellas</option>
                  <option value="3.5">3.5+ estrellas</option>
                  <option value="3.0">3.0+ estrellas</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Verificado
                </label>
                <select
                  value={activeFilters.verified?.toString() || ''}
                  onChange={(e) => handleFilterChange('verified', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Todos</option>
                  <option value="true">Solo verificados</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setFilters({
                    languages: '',
                    tourTypes: '',
                    minRating: '',
                    verified: '',
                    availability: ''
                  });
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Guías Disponibles ({filteredGuides.length})
          </h3>
          <span className="text-sm text-gray-500">
            Ordenado por: {SORT_OPTIONS.find(o => o.value === sortBy)?.label}
          </span>
        </div>

        <div className="p-6">
          {filteredGuides.length > 0 ? (
            viewLayout === 'grid' ? (
              /* ========== VISTA GRID ========== */
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {filteredGuides.map((guide) => (
                  <GuideCard key={guide.id} guide={guide} t={t} onViewProfile={() => navigate(`/marketplace/guide/${guide.id}`)} />
                ))}
              </div>
            ) : (
              /* ========== VISTA LISTA ========== */
              <div className="space-y-3">
                {/* Header de la tabla */}
                <div className="hidden lg:grid lg:grid-cols-12 gap-4 px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                  <div className="col-span-4">Guía</div>
                  <div className="col-span-2">Especialidades</div>
                  <div className="col-span-2">Idiomas</div>
                  <div className="col-span-1 text-center">Rating</div>
                  <div className="col-span-1 text-center">Exp.</div>
                  <div className="col-span-1 text-right">Precio</div>
                  <div className="col-span-1"></div>
                </div>
                {filteredGuides.map((guide) => (
                  <GuideListRow key={guide.id} guide={guide} t={t} onViewProfile={() => navigate(`/marketplace/guide/${guide.id}`)} />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-12">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay guías disponibles</h3>
              <p className="mt-1 text-sm text-gray-500">
                Intenta ajustar los filtros de búsqueda para encontrar más guías.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ========== Componente: Card para vista Grid ========== */
const GuideCard = ({ guide, t, onViewProfile }) => (
  <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow bg-white">
    <div className="relative">
      <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-600"></div>
      <div className="absolute -bottom-10 left-4">
        <img
          src={resolveFileUrl(guide.profileImage || guide.guidePhoto) || `https://ui-avatars.com/api/?name=${guide.name || guide.fullName}&background=3b82f6&color=fff&size=128`}
          alt={guide.name || guide.fullName}
          className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-md"
        />
      </div>
      <div className="absolute top-2 right-2">
        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
          guide.status === 'available' || guide.online
            ? 'bg-green-100 text-green-800'
            : 'bg-gray-100 text-gray-800'
        }`}>
          {guide.status === 'available' || guide.online ? 'Disponible' : 'No disponible'}
        </span>
      </div>
    </div>

    <div className="pt-12 px-4 pb-4">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">
            {guide.name || guide.fullName}
          </h4>
          {guide.licenseNumber && (
            <div className="flex items-center text-xs text-green-600 mt-1">
              <CheckBadgeIcon className="w-4 h-4 mr-1" />
              Licencia: {guide.licenseNumber}
            </div>
          )}
        </div>
        <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-lg">
          <StarIcon className="w-4 h-4 text-yellow-500 fill-current" />
          <span className="text-sm font-medium text-gray-900 ml-1">
            {parseFloat(guide.rating || 0).toFixed(1)}
          </span>
          <span className="text-xs text-gray-500 ml-1">
            ({guide.reviewCount || guide.reviewsCount || 0})
          </span>
        </div>
      </div>

      <p className="text-sm text-gray-600 mt-2 line-clamp-2">
        {guide.bio || t('marketplace.messages.noDescription')}
      </p>

      {guide.yearsOfExperience > 0 && (
        <div className="flex items-center text-sm text-gray-600 mt-3">
          <ClockIcon className="w-4 h-4 mr-2 text-blue-500" />
          <span>{guide.yearsOfExperience} años de experiencia</span>
        </div>
      )}

      {guide.languages && guide.languages.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <LanguageIcon className="w-4 h-4 mr-2 text-blue-500" />
            <span className="font-medium">Idiomas:</span>
          </div>
          <div className="flex flex-wrap gap-1 ml-6">
            {(Array.isArray(guide.languages) ? guide.languages : []).slice(0, 4).map((lang, idx) => (
              <span key={idx} className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full">
                {getLanguageName(lang, t)}
              </span>
            ))}
            {guide.languages.length > 4 && (
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                +{guide.languages.length - 4}
              </span>
            )}
          </div>
        </div>
      )}

      {guide.specialties && guide.specialties.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <AcademicCapIcon className="w-4 h-4 mr-2 text-purple-500" />
            <span className="font-medium">Especialidades:</span>
          </div>
          <div className="flex flex-wrap gap-1 ml-6">
            {(Array.isArray(guide.specialties) ? guide.specialties : []).slice(0, 3).map((spec, idx) => (
              <span key={idx} className="px-2 py-0.5 text-xs bg-purple-50 text-purple-700 rounded-full">
                {typeof spec === 'object' ? spec.name || spec.specialty : spec}
              </span>
            ))}
            {guide.specialties.length > 3 && (
              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                +{guide.specialties.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {guide.education && (
        <div className="flex items-center text-sm text-gray-600 mt-3">
          <AcademicCapIcon className="w-4 h-4 mr-2 text-green-500" />
          <span className="truncate">{guide.education}</span>
        </div>
      )}

      {guide.toursCompleted > 0 && (
        <div className="flex items-center text-sm text-gray-600 mt-2">
          <UserGroupIcon className="w-4 h-4 mr-2 text-orange-500" />
          <span>{guide.toursCompleted} tours completados</span>
        </div>
      )}

      <div className="border-t border-gray-100 mt-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            {guide.pricePerPerson ? (
              <p className="text-xl font-bold text-gray-900">
                S/ {parseFloat(guide.pricePerPerson).toFixed(2)}
                <span className="text-sm font-normal text-gray-500">/persona</span>
              </p>
            ) : (
              <span className="text-sm text-gray-400">Sin tarifa configurada</span>
            )}
          </div>
          <button
            onClick={onViewProfile}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver Perfil
          </button>
        </div>
      </div>
    </div>
  </div>
);

/* ========== Componente: Fila para vista Lista ========== */
const GuideListRow = ({ guide, t, onViewProfile }) => (
  <div
    className="flex flex-col lg:grid lg:grid-cols-12 gap-3 lg:gap-4 items-center px-4 py-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-blue-200 transition-all bg-white cursor-pointer"
    onClick={onViewProfile}
  >
    {/* Guía info */}
    <div className="col-span-4 flex items-center gap-3 w-full">
      <div className="relative flex-shrink-0">
        <img
          src={resolveFileUrl(guide.profileImage || guide.guidePhoto) || `https://ui-avatars.com/api/?name=${guide.name || guide.fullName}&background=3b82f6&color=fff&size=80`}
          alt={guide.name || guide.fullName}
          className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
        />
        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${
          guide.status === 'available' || guide.online ? 'bg-green-500' : 'bg-gray-400'
        }`} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <h4 className="text-sm font-semibold text-gray-900 truncate">
            {guide.name || guide.fullName}
          </h4>
          {guide.licenseNumber && (
            <CheckBadgeIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {guide.bio || t('marketplace.messages.noDescription')}
        </p>
      </div>
    </div>

    {/* Especialidades */}
    <div className="col-span-2 w-full">
      <div className="flex flex-wrap gap-1">
        {(Array.isArray(guide.specialties) ? guide.specialties : []).slice(0, 2).map((spec, idx) => (
          <span key={idx} className="px-2 py-0.5 text-[11px] bg-purple-50 text-purple-700 rounded-full">
            {typeof spec === 'object' ? spec.name || spec.specialty : spec}
          </span>
        ))}
        {guide.specialties?.length > 2 && (
          <span className="px-1.5 py-0.5 text-[11px] bg-gray-100 text-gray-500 rounded-full">
            +{guide.specialties.length - 2}
          </span>
        )}
      </div>
    </div>

    {/* Idiomas */}
    <div className="col-span-2 w-full">
      <div className="flex flex-wrap gap-1">
        {(Array.isArray(guide.languages) ? guide.languages : []).slice(0, 2).map((lang, idx) => (
          <span key={idx} className="px-2 py-0.5 text-[11px] bg-blue-50 text-blue-700 rounded-full">
            {getLanguageName(lang, t)}
          </span>
        ))}
        {guide.languages?.length > 2 && (
          <span className="px-1.5 py-0.5 text-[11px] bg-gray-100 text-gray-500 rounded-full">
            +{guide.languages.length - 2}
          </span>
        )}
      </div>
    </div>

    {/* Rating */}
    <div className="col-span-1 flex items-center justify-center gap-1">
      <StarIcon className="w-4 h-4 text-yellow-500" />
      <span className="text-sm font-semibold text-gray-900">
        {parseFloat(guide.rating || 0).toFixed(1)}
      </span>
    </div>

    {/* Experiencia */}
    <div className="col-span-1 text-center">
      <span className="text-sm text-gray-700">
        {guide.yearsOfExperience || 0} años
      </span>
    </div>

    {/* Precio */}
    <div className="col-span-1 text-right">
      {guide.pricePerPerson ? (
        <span className="text-sm font-bold text-gray-900">
          S/ {parseFloat(guide.pricePerPerson).toFixed(0)}
        </span>
      ) : (
        <span className="text-xs text-gray-400">--</span>
      )}
    </div>

    {/* Acción */}
    <div className="col-span-1 flex justify-end">
      <button
        onClick={(e) => { e.stopPropagation(); onViewProfile(); }}
        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
      >
        Ver
      </button>
    </div>
  </div>
);

export default GuidesMarketplace;
