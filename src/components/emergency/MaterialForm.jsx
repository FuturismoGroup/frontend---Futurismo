import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray } from 'react-hook-form';
import { XMarkIcon, PlusIcon, TrashIcon, DocumentCheckIcon } from '@heroicons/react/24/outline';
import { getIconDisplay } from '../../utils/emergencyIcons';

const MaterialForm = ({ material, categories, onSave, onCancel }) => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors }
  } = useForm({
    defaultValues: {
      name: material?.name || '',
      category: material?.category || '',
      // Backend devuelve tanto 'mandatory' como 'isMandatory' para compatibilidad
      mandatory: material?.mandatory || material?.isMandatory || false,
      // Items viene como array de strings del backend
      items: material?.items?.map(item => ({ name: item })) || [{ name: '' }]
    }
  });

  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem
  } = useFieldArray({
    control,
    name: 'items'
  });

  const onSubmit = (data) => {
    const materialData = {
      name: data.name,
      category: data.category,
      mandatory: data.mandatory,
      items: data.items.map(item => item.name).filter(name => name.trim() !== '')
    };

    onSave(materialData);
  };

  return (
    <div className="modal-overlay p-4">
      <div className="modal-content max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {material ? t('emergency.materials.editMaterial') : t('emergency.materials.newMaterial')}
          </h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Basic info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('emergency.materials.materialName')} *
                </label>
                <input
                  {...register('name', { required: t('emergency.materials.nameRequired') })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('emergency.materials.namePlaceholder')}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('emergency.materials.category')} *
                </label>
                <select
                  {...register('category', { required: t('emergency.materials.categoryRequired') })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('emergency.materials.selectCategory')}</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {getIconDisplay(category.icon)} {category.name}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                )}
              </div>
            </div>

            {/* Mandatory checkbox */}
            <div className="flex items-center space-x-3">
              <input
                {...register('mandatory')}
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label className="text-sm font-medium text-gray-700">
                {t('emergency.materials.mandatoryForAllTours')}
              </label>
            </div>

            {/* Items list */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-gray-900">
                  {t('emergency.materials.materialElements')}
                </h4>
                <button
                  type="button"
                  onClick={() => appendItem({ name: '' })}
                  className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center space-x-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>{t('emergency.materials.addElement')}</span>
                </button>
              </div>

              <div className="space-y-2">
                {itemFields.map((field, index) => (
                  <div key={field.id} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <input
                        {...register(`items.${index}.name`)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={t('emergency.materials.elementPlaceholder')}
                      />
                    </div>
                    {itemFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </form>
        </div>

        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit(onSubmit)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
          >
            <DocumentCheckIcon className="w-4 h-4" />
            <span>{t('common.save')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

MaterialForm.propTypes = {
  material: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    category: PropTypes.string,
    mandatory: PropTypes.bool,
    isMandatory: PropTypes.bool, // Alias del backend
    items: PropTypes.arrayOf(PropTypes.string)
  }),
  categories: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    icon: PropTypes.string.isRequired
  })).isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default MaterialForm;