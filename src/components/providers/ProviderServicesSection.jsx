import { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { TagIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/outline';

import useProvidersStore from '../../stores/providersStore';
import NewServiceModal from './NewServiceModal';
import toast from 'react-hot-toast';

const ProviderServicesSection = ({
  services,
  providerServices,
  handleAddService,
  handleRemoveService,
  handleServiceChange,
  selectedCategory
}) => {
  const { t } = useTranslation();
  const { categories, services: storeServices, actions } = useProvidersStore();
  const [showServiceModal, setShowServiceModal] = useState(false);

  const getServiceOptions = (currentValue = '') => {
    if (!selectedCategory) return [];

    let categoryValue = selectedCategory;
    let categoryId = selectedCategory;
    let categoryName = null;

    if (Array.isArray(categories) && categories.length > 0) {
      const foundCategory = categories.find(cat => cat.id === selectedCategory);
      if (foundCategory) {
        categoryId = foundCategory.id;
        categoryName = foundCategory.name;
        const nameParts = foundCategory.name.split('.');
        categoryValue = nameParts[nameParts.length - 1];
      }
    }

    const options = [];
    const addedIds = new Set();

    // Servicios del proveedor actual (para pre-selección)
    if (Array.isArray(providerServices) && providerServices.length > 0) {
      providerServices.forEach(service => {
        if (service && service.id && !addedIds.has(service.id)) {
          options.push({
            value: service.id,
            label: service.name || service.serviceType || t('providers.services.singular'),
            isDynamic: true,
            isProviderService: true
          });
          addedIds.add(service.id);
        }
      });
    }

    // Servicios del store (filtrados por categoría)
    if (Array.isArray(storeServices) && storeServices.length > 0) {
      const dynamicServices = storeServices.filter(service => {
        const matches = service.category === categoryId ||
                       service.categoryId === categoryId ||
                       service.category === categoryValue ||
                       service.category === categoryName;

        return matches && !addedIds.has(service.id);
      });

      dynamicServices.forEach(service => {
        options.push({
          value: service.id,
          label: service.name,
          isDynamic: true
        });
        addedIds.add(service.id);
      });
    }

    // Excluir servicios ya seleccionados en otras filas para evitar duplicados.
    // Se mantiene el valor actual de la fila (currentValue) para que se muestre correctamente.
    const selectedInOtherRows = new Set(
      services.filter(s => s && s !== currentValue)
    );

    return options.filter(opt => !selectedInOtherRows.has(opt.value));
  };

  const totalAvailableServices = getServiceOptions().length;
  const selectedCount = services.filter(s => s && s.trim()).length;
  const hasEmptyRow = services.some(s => !s || !s.trim());
  const allServicesUsed = selectedCount >= totalAvailableServices && totalAvailableServices > 0;
  const canAddMoreServices = !hasEmptyRow && !allServicesUsed;

  const handleAddServiceClick = () => {
    if (hasEmptyRow) {
      toast.error(t('providers.services.completeRowFirst'));
      return;
    }
    if (allServicesUsed) {
      toast.error(t('providers.services.noMoreAvailable'));
      return;
    }
    handleAddService();
  };

  const handleSaveService = async (serviceData) => {
    if (!selectedCategory) {
      toast.error(t('validation.selectCategoryFirst'));
      throw new Error('Category not selected');
    }

    try {
      const dataWithCategory = {
        ...serviceData,
        categoryId: selectedCategory
      };
      await actions.createService(dataWithCategory);
      toast.success(t('providers.services.createSuccess'));
    } catch (error) {
      const errorMessage = error.message || t('providers.services.createError');

      if (error.response?.data?.details?.servicesInCategory) {
        const existingServices = error.response.data.details.servicesInCategory;

        toast.error(
          <div>
            <div className="font-semibold mb-1">{errorMessage}</div>
            <div className="text-sm mt-2">
              <strong>{t('providers.services.existing')}</strong>
              <ul className="mt-1 list-disc list-inside">
                {existingServices.slice(0, 5).map((name, idx) => (
                  <li key={idx}>{name}</li>
                ))}
                {existingServices.length > 5 && (
                  <li>{t('providers.services.andMore', { count: existingServices.length - 5 })}</li>
                )}
              </ul>
            </div>
          </div>,
          { duration: 6000 }
        );
      } else {
        toast.error(errorMessage);
      }

      throw error;
    }
  };

  const handleOpenServiceModal = () => {
    if (!selectedCategory) {
      toast.error(t('validation.selectCategoryFirst'));
      return;
    }
    setShowServiceModal(true);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      {/* Header de la sección */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <TagIcon className="w-5 h-5 text-blue-500" />
          {t('providers.form.sections.services')}
          <span className="ml-auto text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            {services.length} {services.length === 1 ? t('providers.services.singular') : t('providers.services.plural')}
          </span>
        </h3>
      </div>

      {/* Lista de servicios con scroll interno */}
      <div
        className="overflow-y-auto overscroll-contain px-4 py-3 space-y-2"
        style={{ maxHeight: '140px' }}
      >
        {services.map((service, index) => (
          <div
            key={index}
            className="flex items-center gap-2 group"
          >
            <select
              value={service}
              onChange={(e) => handleServiceChange(index, e.target.value)}
              className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm
                         focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                         hover:border-gray-300 transition-colors cursor-pointer"
            >
              <option value="">{t('providers.form.placeholders.selectService')}</option>
              {getServiceOptions(service).map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {services.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveService(index)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg
                           transition-all opacity-60 group-hover:opacity-100 flex-shrink-0"
                title={t('providers.services.remove')}
              >
                <MinusIcon className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Botones de acción - siempre visibles */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleAddServiceClick}
          disabled={!canAddMoreServices}
          title={
            hasEmptyRow
              ? t('providers.services.completeRowFirst')
              : allServicesUsed
                ? t('providers.services.noMoreAvailable')
                : ''
          }
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg
                      transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1
                      ${canAddMoreServices
                        ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 focus:ring-blue-500'
                        : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      }`}
        >
          <PlusIcon className="w-4 h-4" />
          {t('providers.form.actions.addService')}
        </button>
        <button
          type="button"
          onClick={handleOpenServiceModal}
          disabled={!selectedCategory}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg
                      transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1
                      ${selectedCategory
                        ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 focus:ring-emerald-500'
                        : 'text-gray-400 bg-gray-100 cursor-not-allowed'
                      }`}
          title={selectedCategory ? t('providers.services.createNew') : 'Seleccione una categoría primero'}
        >
          <PlusIcon className="w-4 h-4" />
          {t('providers.services.new')}
        </button>
      </div>

      {/* Modal de Nuevo Servicio */}
      <NewServiceModal
        isOpen={showServiceModal}
        onClose={() => setShowServiceModal(false)}
        onSave={handleSaveService}
        selectedCategory={selectedCategory}
        categories={categories}
      />
    </div>
  );
};

ProviderServicesSection.propTypes = {
  services: PropTypes.arrayOf(PropTypes.string).isRequired,
  providerServices: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    serviceType: PropTypes.string
  })),
  handleAddService: PropTypes.func.isRequired,
  handleRemoveService: PropTypes.func.isRequired,
  handleServiceChange: PropTypes.func.isRequired,
  selectedCategory: PropTypes.string
};

export default ProviderServicesSection;
