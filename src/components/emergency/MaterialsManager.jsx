import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { 
  ArchiveBoxIcon, 
  PlusIcon,
  PrinterIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import useMaterialsManager from '../../hooks/useMaterialsManager';
import useMaterialActions from '../../hooks/useMaterialActions';
import MaterialForm from './MaterialForm';
import MaterialStats from './MaterialStats';
import MaterialFilters from './MaterialFilters';
import MaterialCard from './MaterialCard';
import MandatorySummary from './MandatorySummary';

const MaterialsManager = ({ isAdmin = false }) => {
  const { t } = useTranslation();
  const {
    isEditing,
    setIsEditing,
    editingMaterial,
    setEditingMaterial,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    expandedMaterial,
    showOnlyMandatory,
    setShowOnlyMandatory,
    categories,
    filteredMaterials,
    stats,
    handleSaveMaterial,
    handleEditMaterial,
    handleDeleteMaterial,
    handleViewMaterial,
    getCategoryInfo,
    resetFilters
  } = useMaterialsManager();

  const {
    handleCopyMaterialList,
    handlePrintMaterial,
    handlePrintAllMandatory,
    handleCopyAllMandatory
  } = useMaterialActions();

  const handleStatClick = (statType) => {
    resetFilters();
    if (statType === 'mandatory') {
      setShowOnlyMandatory(true);
    }
  };

  if (isEditing) {
    return (
      <MaterialForm
        material={editingMaterial}
        categories={categories}
        onSave={handleSaveMaterial}
        onCancel={() => {
          setIsEditing(false);
          setEditingMaterial(null);
        }}
      />
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ArchiveBoxIcon className="w-8 h-8 mr-3 text-purple-500" />
            {t('emergency.materials.title')}
          </h1>
          <p className="text-gray-600 mt-1">
            {t('emergency.materials.subtitle')}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {isAdmin && (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center space-x-2"
            >
              <PlusIcon className="w-4 h-4" />
              <span>{t('emergency.materials.newMaterial')}</span>
            </button>
          )}
          
          <button
            onClick={() => handlePrintAllMandatory(filteredMaterials, getCategoryInfo)}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
          >
            <PrinterIcon className="w-4 h-4" />
            <span>{t('emergency.materials.printMandatory')}</span>
          </button>

          <button
            onClick={() => handleCopyAllMandatory(filteredMaterials, getCategoryInfo)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <DocumentDuplicateIcon className="w-4 h-4" />
            <span>{t('emergency.materials.copyMandatory')}</span>
          </button>
          
        </div>
      </div>

      {/* Stats */}
      <MaterialStats stats={stats} onStatClick={handleStatClick} />

      {/* Filters */}
      <MaterialFilters
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        showOnlyMandatory={showOnlyMandatory}
        setShowOnlyMandatory={setShowOnlyMandatory}
        categories={categories}
      />

      {/* Materials list */}
      {filteredMaterials.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <ArchiveBoxIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {t('emergency.materials.noMaterialsFound')}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('emergency.materials.adjustFilters')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map(material => {
            const category = getCategoryInfo(material.category);
            return (
              <MaterialCard
                key={material.id}
                material={material}
                category={category}
                isExpanded={expandedMaterial?.id === material.id}
                isAdmin={isAdmin}
                onView={() => handleViewMaterial(material)}
                onEdit={() => handleEditMaterial(material)}
                onDelete={() => handleDeleteMaterial(material.id)}
                onCopy={() => handleCopyMaterialList(material, getCategoryInfo)}
                onPrint={() => handlePrintMaterial(material, getCategoryInfo)}
              />
            );
          })}
        </div>
      )}

      {/* Mandatory summary */}
      <MandatorySummary
        mandatoryMaterials={filteredMaterials.filter(m => m.isMandatory || m.mandatory)}
      />
    </div>
  );
};

MaterialsManager.propTypes = {
  isAdmin: PropTypes.bool
};

export default MaterialsManager;