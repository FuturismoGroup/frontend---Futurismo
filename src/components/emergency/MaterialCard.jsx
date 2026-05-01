import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {
  CheckCircleIcon,
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  PrinterIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { getIconDisplay } from '../../utils/emergencyIcons';

const MaterialCard = ({
  material,
  category,
  isExpanded,
  isAdmin,
  onView,
  onEdit,
  onDelete,
  onCopy,
  onPrint
}) => {
  const { t } = useTranslation();

  // Asegurar que items sea siempre un array
  const items = Array.isArray(material.items) ? material.items : [];

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={onView}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
              style={{ backgroundColor: category.color + '20' }}
            >
              {getIconDisplay(category.icon)}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 line-clamp-2">
                {material.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-600">{category.name}</span>
                {material.mandatory && (
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200">
                    {t('emergency.materials.mandatoryBadge')}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Elements list */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-700">
              {t('emergency.materials.elementsCount', { count: items.length })}
            </h4>
            {items.length > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView();
                }}
                className="text-blue-500 hover:text-blue-600 text-xs"
              >
                {isExpanded ? t('emergency.materials.seeLess') : t('emergency.materials.seeAll')}
              </button>
            )}
          </div>
          <div className={`${isExpanded ? 'max-h-64' : 'max-h-32'} overflow-y-auto transition-all duration-200`}>
            {items.length > 0 ? (
              <>
                {(isExpanded ? items : items.slice(0, 4)).map((item, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm text-gray-600 mb-1">
                    <CheckCircleIcon className="w-3 h-3 text-green-500 flex-shrink-0" />
                    <span className="line-clamp-1">{item}</span>
                  </div>
                ))}
                {items.length > 4 && !isExpanded && (
                  <div className="text-sm text-gray-500 mt-1">
                    +{items.length - 4} {t('emergency.materials.moreElements')}
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-gray-400 italic">
                {material.description || t('emergency.materials.noItems')}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {isAdmin ? (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
              >
                <PencilIcon className="w-4 h-4" />
                <span>{t('common.edit')}</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                title={t('emergency.materials.deleteMaterial')}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCopy();
                }}
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                title={t('emergency.materials.copyToClipboard')}
              >
                <DocumentDuplicateIcon className="w-4 h-4" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrint();
                }}
                className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                title={t('emergency.materials.printList')}
              >
                <PrinterIcon className="w-4 h-4" />
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onView();
                }}
                className="flex-1 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center space-x-2"
              >
                <EyeIcon className="w-4 h-4" />
                <span>{isExpanded ? t('emergency.materials.collapse') : t('emergency.materials.viewDetail')}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

MaterialCard.propTypes = {
  material: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    mandatory: PropTypes.bool,
    description: PropTypes.string,
    items: PropTypes.arrayOf(PropTypes.string) // No requerido - puede venir del backend sin items
  }).isRequired,
  category: PropTypes.shape({
    name: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired,
    color: PropTypes.string.isRequired
  }).isRequired,
  isExpanded: PropTypes.bool.isRequired,
  isAdmin: PropTypes.bool.isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onCopy: PropTypes.func,
  onPrint: PropTypes.func
};

export default MaterialCard;