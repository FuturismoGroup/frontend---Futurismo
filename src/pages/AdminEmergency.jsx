import { useState, useEffect } from 'react';
import { ShieldCheckIcon, ArchiveBoxIcon, CogIcon, UserGroupIcon, ExclamationTriangleIcon, DocumentTextIcon, ArrowDownTrayIcon, PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, FunnelIcon, CheckCircleIcon, PhoneIcon, ChartBarIcon, EyeIcon, SwatchIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import useEmergencyStore from '../stores/emergencyStore';
import ProtocolEditor from '../components/emergency/ProtocolEditor';
import MaterialsManager from '../components/emergency/MaterialsManager';
import EmergencyCategoryManager from '../components/emergency/EmergencyCategoryManager';
import ContactTypeManager from '../components/emergency/ContactTypeManager';
import emergencyPDFService from '../services/emergencyPDFService';
import { getIconDisplay } from '../utils/emergencyIcons';

const AdminEmergency = () => {
  const { t } = useTranslation();
  const protocols = useEmergencyStore((state) => state.protocols);
  const materials = useEmergencyStore((state) => state.materials);
  const categories = useEmergencyStore((state) => state.categories);
  const initialize = useEmergencyStore((state) => state.initialize);
  const fetchProtocols = useEmergencyStore((state) => state.fetchProtocols);
  const fetchMaterials = useEmergencyStore((state) => state.fetchMaterials);
  const updateProtocol = useEmergencyStore((state) => state.updateProtocol);
  const createProtocol = useEmergencyStore((state) => state.createProtocol);
  const deleteProtocol = useEmergencyStore((state) => state.deleteProtocol);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'protocols', 'materials'
  const [selectedProtocol, setSelectedProtocol] = useState(null);
  const [isEditingProtocol, setIsEditingProtocol] = useState(false);
  const [showMaterials, setShowMaterials] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Inicializar store y cargar datos
  useEffect(() => {
    const initializeData = async () => {
      try {
        await initialize();
        await fetchProtocols();
        await fetchMaterials();
      } catch (error) {
        console.error('Error initializing emergency data:', error);
      }
    };

    initializeData();
  }, [initialize, fetchProtocols, fetchMaterials]);

  // Estadísticas
  const stats = {
    totalProtocols: protocols?.length || 0,
    highPriorityProtocols: protocols?.filter(p => p.priority === 'alta').length || 0,
    totalMaterials: materials?.length || 0,
    mandatoryMaterials: materials?.filter(m => m.isMandatory || m.mandatory).length || 0,
    categoriesCount: categories?.length || 0
  };

  // Filtrar protocolos
  const filteredProtocols = (protocols || []).filter(protocol => {
    const matchesSearch = !searchQuery ||
      protocol.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      protocol.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !filterCategory || protocol.categoryId === filterCategory || protocol.category?.id === filterCategory;

    return matchesSearch && matchesCategory;
  });

  const handleDownloadAllProtocols = async () => {
    try {
      if (!protocols || protocols.length === 0) {
        alert(t('emergency.adminPage.noProtocolsAlert'));
        return;
      }
      await emergencyPDFService.downloadAllProtocolsPDF(protocols);
    } catch (error) {
      console.error('Error descargando protocolos:', error);
      alert(`${t('emergency.adminPage.pdfGenerateError')} ${error.message}`);
    }
  };

  const handleDownloadGuideKit = async () => {
    try {
      await emergencyPDFService.downloadGuideEmergencyKit();
    } catch (error) {
      console.error('Error descargando kit:', error);
      alert(t('emergency.adminPage.kitPdfError'));
    }
  };

  const getCategoryInfo = (categoryId) => {
    return (categories || []).find(c => c.id === categoryId) || {
      name: categoryId,
      icon: '📋',
      color: '#6B7280'
    };
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 text-red-800 border-red-200';
      case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baja': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isEditingProtocol) {
    return (
      <ProtocolEditor
        protocol={selectedProtocol}
        onClose={() => {
          setIsEditingProtocol(false);
          setSelectedProtocol(null);
        }}
        onSave={(updatedProtocol) => {
          if (selectedProtocol) {
            updateProtocol(selectedProtocol.id, updatedProtocol);
          } else {
            createProtocol(updatedProtocol);
          }
          setIsEditingProtocol(false);
          setSelectedProtocol(null);
        }}
      />
    );
  }

  if (showMaterials) {
    return (
      <MaterialsManager
        isAdmin={true}
      />
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ShieldCheckIcon className="w-8 h-8 mr-3 text-red-500" />
            {t('emergency.adminPage.title')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('emergency.adminPage.subtitle')}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadAllProtocols}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <DocumentTextIcon className="w-4 h-4" />
            <span>{t('emergency.adminPage.manualPdf')}</span>
          </button>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ChartBarIcon className="w-4 h-4 inline mr-2" />
            {t('emergency.adminPage.tabs.overview')}
          </button>

          <button
            onClick={() => setActiveTab('protocols')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'protocols'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ShieldCheckIcon className="w-4 h-4 inline mr-2" />
            {t('emergency.adminPage.tabs.protocols')} ({protocols?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('materials')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'materials'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <ArchiveBoxIcon className="w-4 h-4 inline mr-2" />
            {t('emergency.adminPage.tabs.materials')} ({materials?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'categories'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <SwatchIcon className="w-4 h-4 inline mr-2" />
            {t('emergency.adminPage.tabs.categories')} ({categories?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('contactTypes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'contactTypes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <PhoneIcon className="w-4 h-4 inline mr-2" />
            {t('emergency.adminPage.tabs.contactTypes')}
          </button>

        </nav>
      </div>

      {/* Contenido de las tabs */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Estadísticas principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <ShieldCheckIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('emergency.adminPage.stats.totalProtocols')}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalProtocols}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('emergency.adminPage.stats.highPriority')}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.highPriorityProtocols}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ArchiveBoxIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('emergency.adminPage.stats.totalMaterials')}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.totalMaterials}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('emergency.adminPage.stats.mandatory')}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.mandatoryMaterials}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <CogIcon className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{t('emergency.adminPage.stats.categories')}</p>
                  <p className="text-2xl font-semibold text-gray-900">{stats.categoriesCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('emergency.adminPage.quickActions.title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setIsEditingProtocol(true)}
                className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <PlusIcon className="w-6 h-6 text-green-600" />
                  <div>
                    <h4 className="font-medium text-green-900">{t('emergency.adminPage.quickActions.newProtocol')}</h4>
                    <p className="text-sm text-green-700">{t('emergency.adminPage.quickActions.newProtocolDesc')}</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowMaterials(true)}
                className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <ArchiveBoxIcon className="w-6 h-6 text-purple-600" />
                  <div>
                    <h4 className="font-medium text-purple-900">{t('emergency.adminPage.quickActions.manageMaterials')}</h4>
                    <p className="text-sm text-purple-700">{t('emergency.adminPage.quickActions.manageMaterialsDesc')}</p>
                  </div>
                </div>
              </button>

              <button
                onClick={handleDownloadAllProtocols}
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-left"
              >
                <div className="flex items-center space-x-3">
                  <ArrowDownTrayIcon className="w-6 h-6 text-blue-600" />
                  <div>
                    <h4 className="font-medium text-blue-900">{t('emergency.adminPage.quickActions.generateManual')}</h4>
                    <p className="text-sm text-blue-700">{t('emergency.adminPage.quickActions.generateManualDesc')}</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Protocolos recientes */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">{t('emergency.adminPage.recentProtocols')}</h3>
                <button
                  onClick={() => setActiveTab('protocols')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {t('emergency.adminPage.viewAll')}
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {(protocols || []).slice(0, 3).map(protocol => {
                  const category = protocol.category || getCategoryInfo(protocol.categoryId);
                  return (
                    <div key={protocol.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getIconDisplay(protocol.icon || category?.icon)}</span>
                        <div>
                          <h4 className="font-medium text-gray-900">{protocol.title}</h4>
                          <p className="text-sm text-gray-600">{category?.name} • {protocol.lastUpdated}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span 
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(protocol.priority)}`}
                        >
                          {protocol.priority?.toUpperCase()}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedProtocol(protocol);
                            setIsEditingProtocol(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'protocols' && (
        <div className="space-y-6">
          {/* Filtros y acciones */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0">
              <div className="flex flex-col md:flex-row md:items-center space-y-3 md:space-y-0 md:space-x-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder={t('emergency.adminPage.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <FunnelIcon className="w-4 h-4 text-gray-500" />
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">{t('emergency.adminPage.allCategories')}</option>
                    {(categories || []).map(category => (
                      <option key={category.id} value={category.id}>
                        {getIconDisplay(category.icon)} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={() => setIsEditingProtocol(true)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
              >
                <PlusIcon className="w-4 h-4" />
                <span>{t('emergency.adminPage.newProtocolBtn')}</span>
              </button>
            </div>
          </div>

          {/* Lista de protocolos */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('emergency.adminPage.table.protocol')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('emergency.adminPage.table.category')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('emergency.adminPage.table.priority')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('emergency.adminPage.table.steps')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('emergency.adminPage.table.contacts')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('emergency.adminPage.table.updated')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('emergency.adminPage.table.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredProtocols.map(protocol => {
                    const category = protocol.category || getCategoryInfo(protocol.categoryId);
                    return (
                      <tr key={protocol.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{getIconDisplay(protocol.icon || category?.icon)}</span>
                            <div>
                              <div className="font-medium text-gray-900">{protocol.title}</div>
                              <div className="text-sm text-gray-500 line-clamp-1">{protocol.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <span>{getIconDisplay(category?.icon)}</span>
                            <span className="text-sm text-gray-900">{category?.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span 
                            className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(protocol.priority)}`}
                          >
                            {protocol.priority?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {t('emergency.adminPage.table.stepsCount', { count: protocol.steps?.length || protocol.stepsCount || 0 })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {t('emergency.adminPage.table.contactsCount', { count: protocol.contacts?.length || 0 })}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {protocol.updatedAt ? new Date(protocol.updatedAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setSelectedProtocol(protocol);
                                setIsEditingProtocol(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title={t('emergency.adminPage.editProtocolTitle')}
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => {
                                if (confirm(t('emergency.adminPage.deleteProtocolConfirm'))) {
                                  deleteProtocol(protocol.id);
                                }
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title={t('emergency.adminPage.deleteProtocolTitle')}
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'materials' && (
        <div className="space-y-6">
          <MaterialsManager isAdmin={true} />
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="space-y-6">
          <EmergencyCategoryManager onCategoriesChanged={initialize} />
        </div>
      )}

      {activeTab === 'contactTypes' && (
        <div className="space-y-6">
          <ContactTypeManager onContactTypesChanged={initialize} />
        </div>
      )}
    </div>
  );
};

export default AdminEmergency;