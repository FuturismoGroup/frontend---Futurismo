import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { MapPinIcon, PlusIcon, MagnifyingGlassIcon, FunnelIcon, Squares2X2Icon, ListBulletIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import useProvidersStore from '../../stores/providersStore';
import useAuthStore from '../../stores/authStore';
import ProviderCard from './ProviderCard';
import ProviderForm from './ProviderForm';
import LocationTree from './LocationTree';

const ProvidersManager = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  // Solo el admin puede gestionar (crear/editar/eliminar) proveedores.
  // Los guías (planta o freelance) tienen el módulo en modo solo lectura.
  const canManage = user?.role === 'admin' || user?.role === 'administrator';
  const {
    locations,
    categories,
    providers,
    selectedLocation,
    selectedCategory,
    isLoading,
    actions
  } = useProvidersStore();

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list' | 'tree'
  const [showForm, setShowForm] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    location: '',
    category: '',
    minRating: 0
  });

  // Initialize data
  useEffect(() => {
    const loadData = async () => {
      try {
        await actions.initialize();
        await actions.fetchProviders();
      } catch (error) {
        console.error('Error loading providers data:', error);
      }
    };
    
    loadData();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    const applyFilters = async () => {
      try {
        const filterParams = {
          search: searchQuery,
          location: selectedLocation || filters.location || undefined,
          category: selectedCategory || filters.category || undefined,
          minRating: filters.minRating || undefined
        };
        
        await actions.setFilters(filterParams);
      } catch (error) {
        console.error('Error applying filters:', error);
      }
    };
    
    applyFilters();
  }, [searchQuery, filters, selectedLocation, selectedCategory, actions]);

  // Filtrar proveedores local
  const filteredProviders = useMemo(() => {
    if (!providers || !Array.isArray(providers)) {
      return [];
    }
    
    return providers.filter(provider => {
      if (searchQuery && !provider.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      if (filters.location && provider.location !== filters.location) {
        return false;
      }
      
      if (filters.category && provider.category !== filters.category) {
        return false;
      }
      
      if (filters.minRating && (provider.rating || 0) < filters.minRating) {
        return false;
      }
      
      return true;
    });
  }, [providers, searchQuery, filters]);

  const handleAddProvider = () => {
    if (!canManage) return;
    setEditingProvider(null);
    setShowForm(true);
  };

  const handleEditProvider = async (provider) => {
    if (!canManage) return;
    try {
      // Fetch del proveedor completo con servicios
      const fullProvider = await actions.fetchProviderById(provider.id);
      setEditingProvider(fullProvider);
      setShowForm(true);
    } catch (error) {
      console.error('Error loading provider details:', error);
      // Fallback: usar datos del listado si falla el fetch
      setEditingProvider(provider);
      setShowForm(true);
    }
  };

  const handleDeleteProvider = async (providerId) => {
    if (!canManage) return;
    if (window.confirm(t('providers.confirm.delete'))) {
      try {
        await actions.deleteProvider(providerId);
      } catch (error) {
        console.error('Error deleting provider:', error);
      }
    }
  };

  const handleSaveProvider = async (providerData) => {
    if (!canManage) return;
    try {
      if (editingProvider) {
        await actions.updateProvider(editingProvider.id, providerData);
      } else {
        await actions.createProvider(providerData);
      }
      setShowForm(false);
      setEditingProvider(null);
    } catch (error) {
      console.error('Error saving provider:', error);
      // Re-lanzar para que el form pueda mostrar toast de error
      // y NO se cierre dejando creer al usuario que se guardó
      throw error;
    }
  };

  const getLocationName = (locationId) => {
    return locations.find(l => l.id === locationId)?.name || '';
  };

  const getCategoryInfo = (categoryId) => {
    return categories.find(c => c.id === categoryId);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header mejorado */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('providers.title')}</h1>
            <p className="text-blue-100 text-lg">
              {t('providers.subtitle')}
            </p>
            <div className="mt-4 flex items-center space-x-6 text-sm">
              <div className="flex items-center">
                <BuildingOffice2Icon className="w-5 h-5 mr-2" />
                <span className="font-semibold">{filteredProviders.length}</span>
                <span className="ml-1 text-blue-100">{t('providers.stats.providers')}</span>
              </div>
              <div className="flex items-center">
                <MapPinIcon className="w-5 h-5 mr-2" />
                <span className="font-semibold">{locations.length}</span>
                <span className="ml-1 text-blue-100">{t('providers.stats.locations')}</span>
              </div>
              <div className="flex items-center">
                <FunnelIcon className="w-5 h-5 mr-2" />
                <span className="font-semibold">{categories.length}</span>
                <span className="ml-1 text-blue-100">{t('providers.stats.categories')}</span>
              </div>
            </div>
          </div>

          {canManage && (
            <button
              onClick={handleAddProvider}
              className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center space-x-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>{t('providers.actions.new')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filtros y búsqueda mejorados */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Búsqueda mejorada */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder={t('providers.search.placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 w-full border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Filtros mejorados */}
          <div className="flex items-center space-x-3">
            <select
              value={filters.location}
              onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
              className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="">{t('providers.filters.allLocations')}</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>

            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="border-2 border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="">{t('providers.filters.allCategories')}</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {t(category.name)}
                </option>
              ))}
            </select>
          </div>

          {/* Modo de vista mejorado */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setViewMode('tree')}
              className={`p-2.5 rounded-lg transition-all ${
                viewMode === 'tree'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white hover:text-gray-900'
              }`}
              title={t('providers.title')}
            >
              <BuildingOffice2Icon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white hover:text-gray-900'
              }`}
              title={t('common.view')}
            >
              <Squares2X2Icon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2.5 rounded-lg transition-all ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white hover:text-gray-900'
              }`}
              title={t('reservations.list')}
            >
              <ListBulletIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex gap-6">
        {/* Árbol de ubicaciones/categorías (sidebar) */}
        {viewMode === 'tree' && (
          <div className="w-80 flex-shrink-0">
            <LocationTree />
          </div>
        )}

        {/* Lista/Grilla de proveedores */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
              <p className="text-gray-600 font-medium">{t('providers.loading')}</p>
            </div>
          ) : (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProviders.map(provider => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      locationName={getLocationName(provider.location)}
                      categoryInfo={getCategoryInfo(provider.category)}
                      onEdit={canManage ? () => handleEditProvider(provider) : undefined}
                      onDelete={canManage ? () => handleDeleteProvider(provider.id) : undefined}
                      canManage={canManage}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProviders.map(provider => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      locationName={getLocationName(provider.location)}
                      categoryInfo={getCategoryInfo(provider.category)}
                      onEdit={canManage ? () => handleEditProvider(provider) : undefined}
                      onDelete={canManage ? () => handleDeleteProvider(provider.id) : undefined}
                      canManage={canManage}
                      layout="list"
                    />
                  ))}
                </div>
              )}

              {filteredProviders.length === 0 && !isLoading && (
                <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-16 text-center">
                  <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BuildingOffice2Icon className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {t('providers.empty.title')}
                  </h3>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    {searchQuery || filters.location || filters.category
                      ? t('providers.empty.filterHint')
                      : canManage
                        ? t('providers.empty.startHint')
                        : t('providers.empty.title')}
                  </p>
                  {canManage && (
                    <button
                      onClick={handleAddProvider}
                      className="bg-blue-600 text-white hover:bg-blue-700 font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 inline-flex items-center space-x-2"
                    >
                      <PlusIcon className="w-5 h-5" />
                      <span>{t('providers.actions.add')}</span>
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modales — solo accesibles para administradores */}
      {canManage && showForm && (
        <ProviderForm
          key={editingProvider?.id || 'new-provider'}
          provider={editingProvider}
          onSave={handleSaveProvider}
          onCancel={() => {
            setShowForm(false);
            setEditingProvider(null);
          }}
        />
      )}

    </div>
  );
};

export default ProvidersManager;