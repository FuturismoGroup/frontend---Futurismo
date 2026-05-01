import React from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { 
  XMarkIcon, 
  DocumentCheckIcon, 
  ExclamationTriangleIcon, 
  ShieldCheckIcon 
} from '@heroicons/react/24/outline';
import useEmergencyStore from '../../stores/emergencyStore';
import useProtocolEditor from '../../hooks/useProtocolEditor';
import ProtocolBasicInfo from './ProtocolBasicInfo';
import ProtocolSteps from './ProtocolSteps';
import ProtocolContacts from './ProtocolContacts';
import ProtocolMaterials from './ProtocolMaterials';

const ProtocolEditor = ({ protocol, onClose, onSave }) => {
  const { t } = useTranslation();
  const categories = useEmergencyStore((state) => state.categories);
  const {
    register,
    handleSubmit,
    setValue,
    errors,
    onSubmit,
    stepFields,
    appendStep,
    removeStep,
    contactFields,
    appendContact,
    removeContact,
    selectedMaterials,
    setSelectedMaterials,
    selectedIcon,
    setSelectedIcon,
    iconOptions,
    contactTypes,
    getPriorityColor,
    watchedPriority
  } = useProtocolEditor(protocol, onSave);

  return (
    <div className="modal-overlay p-4">
      <div className="modal-content max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <ShieldCheckIcon className="w-6 h-6 mr-2 text-blue-500" />
            {protocol ? t('emergency.protocol.editProtocol') : t('emergency.protocol.newProtocol')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            {/* Basic info */}
            <ProtocolBasicInfo
              register={register}
              errors={errors}
              categories={categories}
              watchedPriority={watchedPriority}
              getPriorityColor={getPriorityColor}
              selectedIcon={selectedIcon}
              setSelectedIcon={setSelectedIcon}
              setValue={setValue}
              iconOptions={iconOptions}
            />

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('emergency.protocol.description')} *
              </label>
              <textarea
                {...register('description', { 
                  required: t('emergency.protocol.descriptionRequired') 
                })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('emergency.protocol.descriptionPlaceholder')}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Protocol steps */}
            <ProtocolSteps
              stepFields={stepFields}
              register={register}
              errors={errors}
              appendStep={appendStep}
              removeStep={removeStep}
            />

            {/* Emergency contacts */}
            <ProtocolContacts
              contactFields={contactFields}
              register={register}
              appendContact={appendContact}
              removeContact={removeContact}
              contactTypes={contactTypes}
            />

            {/* Necessary materials */}
            <ProtocolMaterials
              selectedMaterials={selectedMaterials}
              onMaterialsChange={setSelectedMaterials}
            />

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900 mb-1">
                    {t('emergency.protocol.important')}
                  </h4>
                  <p className="text-yellow-800 text-sm">
                    {t('emergency.protocol.importantNote')}
                  </p>
                </div>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            * {t('common.requiredFields')}
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              onClick={handleSubmit(onSubmit)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <DocumentCheckIcon className="w-4 h-4" />
              <span>
                {protocol ? t('common.update') : t('common.save')} {t('emergency.protocol.protocol')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

ProtocolEditor.propTypes = {
  protocol: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    categoryId: PropTypes.string,
    // category puede ser string (ID) u objeto (del backend)
    category: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string
      })
    ]),
    priority: PropTypes.string,
    icon: PropTypes.string,
    // Nuevo formato: contacts directamente en el protocolo
    contacts: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      phone: PropTypes.string,
      type: PropTypes.string
    })),
    // Nuevo formato: materialIds directamente en el protocolo
    materialIds: PropTypes.arrayOf(PropTypes.string),
    // steps puede venir del backend como array de objetos
    steps: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      stepNumber: PropTypes.number,
      title: PropTypes.string,
      description: PropTypes.string
    })),
    // Formato antiguo (compatibilidad)
    content: PropTypes.shape({
      steps: PropTypes.arrayOf(PropTypes.string),
      contacts: PropTypes.arrayOf(PropTypes.shape({
        name: PropTypes.string,
        phone: PropTypes.string,
        type: PropTypes.string
      })),
      materials: PropTypes.arrayOf(PropTypes.string)
    })
  }),
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired
};

export default ProtocolEditor;