import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import useProviderForm from '../../hooks/useProviderForm';
import useModalTransitions from '../../hooks/useModalTransitions';
import ProviderFormHeader from './ProviderFormHeader';
import ProviderBasicInfo from './ProviderBasicInfo';
import ProviderContactInfo from './ProviderContactInfo';
import ProviderServicesSection from './ProviderServicesSection';

const ProviderForm = ({ provider, onSave, onCancel }) => {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    errors,
    watch,
    services,
    providerServices,
    handleAddService,
    handleRemoveService,
    handleServiceChange,
    onSubmit,
    handleCancel
  } = useProviderForm(provider, onSave, onCancel);

  // Hook para manejar transiciones suaves del modal
  const {
    modalRef,
    closeWithAnimation,
    getModalProps,
    getDialogProps
  } = useModalTransitions(true, onCancel, {
    closeOnEscape: true,
    closeOnOverlay: true,
    transitionDuration: 1000,
    animationType: 'scale'
  });

  // Función mejorada para cerrar con animación
  const handleCancelWithAnimation = () => {
    closeWithAnimation();
  };

  const selectedCategory = watch('category');

  return (
    <div
      {...getModalProps()}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center sm:items-center justify-center p-0 sm:p-3 lg:p-4"
    >
      <div
        {...getDialogProps()}
        className="bg-white sm:rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden h-full sm:h-auto"
        style={{ maxHeight: 'calc(100dvh - 0px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full min-h-0">
          {/* Header fijo */}
          <ProviderFormHeader
            isEditing={!!provider}
            onCancel={handleCancelWithAnimation}
            onSubmit={handleSubmit(onSubmit)}
          />

          {/* Contenido scrolleable */}
          <div className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-6 py-5">
            <div className="space-y-5">
              <ProviderBasicInfo
                register={register}
                errors={errors}
                watch={watch}
              />

              <ProviderContactInfo
                register={register}
                errors={errors}
              />

              {/* Observaciones */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center">
                  <DocumentTextIcon className="w-5 h-5 mr-2" />
                  {t('providers.form.sections.observations')}
                </h3>
                <textarea
                  {...register('observations')}
                  rows="3"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.observations ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={t('providers.form.placeholders.observations')}
                />
                {errors.observations && (
                  <p className="mt-1 text-sm text-red-600">{errors.observations.message}</p>
                )}
              </div>

              <ProviderServicesSection
                services={services}
                providerServices={providerServices}
                handleAddService={handleAddService}
                handleRemoveService={handleRemoveService}
                handleServiceChange={handleServiceChange}
                selectedCategory={selectedCategory}
              />
            </div>

            {/* Espaciado inferior para asegurar que todo el contenido sea visible */}
            <div className="h-4" />
          </div>
        </form>
      </div>
    </div>
  );
};

ProviderForm.propTypes = {
  provider: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default ProviderForm;