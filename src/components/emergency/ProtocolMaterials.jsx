import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { ShoppingBagIcon, XMarkIcon } from '@heroicons/react/24/outline';
import useEmergencyStore from '../../stores/emergencyStore';

const ProtocolMaterials = ({
  selectedMaterials = [],
  onMaterialsChange
}) => {
  const { t } = useTranslation();
  const materials = useEmergencyStore((state) => state.materials);
  const fetchMaterials = useEmergencyStore((state) => state.fetchMaterials);
  const [selectedMaterialId, setSelectedMaterialId] = useState('');

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleAddMaterial = (e) => {
    const materialId = e.target.value;
    if (!materialId || !materials) return;

    const material = materials.find(m => m.id === materialId);
    if (material && !selectedMaterials.find(m => m.id === materialId)) {
      onMaterialsChange([...selectedMaterials, material]);
    }
    setSelectedMaterialId('');
  };

  const handleRemoveMaterial = (materialId) => {
    const updatedMaterials = selectedMaterials.filter(m => m.id !== materialId);
    onMaterialsChange(updatedMaterials);
  };

  // Filter out already selected materials from the dropdown
  const availableMaterials = (materials || []).filter(
    m => !selectedMaterials.find(sm => sm.id === m.id)
  );

  const getCategoryColor = (category) => {
    const colors = {
      medico: 'bg-red-100 text-red-800',
      climatico: 'bg-blue-100 text-blue-800',
      comunicacion: 'bg-green-100 text-green-800',
      seguridad: 'bg-yellow-100 text-yellow-800',
      transporte: 'bg-purple-100 text-purple-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center mb-3">
          <ShoppingBagIcon className="w-5 h-5 mr-2 text-purple-500" />
          {t('emergency.protocol.necessaryMaterials')}
        </h3>

        {/* Combobox para agregar materiales */}
        <select
          value={selectedMaterialId}
          onChange={handleAddMaterial}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        >
          <option value="">{t('emergency.protocol.selectMaterials')}</option>
          {availableMaterials.map((material) => (
            <option key={material.id} value={material.id}>
              {material.name} - {material.category}
              {material.mandatory ? ` (${t('emergency.comp.mandatory')})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Selected Materials */}
      {selectedMaterials.length > 0 && (
        <div className="space-y-3">
          {selectedMaterials.map((material) => (
            <div
              key={material.id}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-gray-900">{material.name}</h4>
                    {material.mandatory && (
                      <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded-full">
                        {t('emergency.comp.mandatory')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 text-xs rounded-full ${getCategoryColor(material.category)}`}>
                      {material.category}
                    </span>
                    {material.items && material.items.length > 0 && (
                      <span className="text-xs text-gray-500">
                        {material.items.length} {t('emergency.comp.itemsIncluded')}
                      </span>
                    )}
                  </div>

                  {/* Items preview */}
                  {material.items && material.items.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <details className="text-xs text-gray-600">
                        <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                          {t('emergency.comp.viewItemsIncluded')}
                        </summary>
                        <ul className="mt-2 space-y-1 ml-4">
                          {material.items.map((item, idx) => (
                            <li key={idx}>• {item}</li>
                          ))}
                        </ul>
                      </details>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveMaterial(material.id)}
                  className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label={t('common.delete')}
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

ProtocolMaterials.propTypes = {
  selectedMaterials: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    category: PropTypes.string,
    mandatory: PropTypes.bool,
    items: PropTypes.arrayOf(PropTypes.string)
  })),
  onMaterialsChange: PropTypes.func.isRequired
};

export default ProtocolMaterials;