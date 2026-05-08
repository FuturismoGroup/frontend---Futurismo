import { StarIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, PencilIcon, TrashIcon, BuildingOffice2Icon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';
import { getCategoryIconComponent } from '../../utils/providerCategoryIcons';

const ProviderCard = ({
  provider,
  locationName,
  categoryInfo,
  onEdit,
  onDelete,
  canManage = false,
  layout = 'card'
}) => {
  const { t } = useTranslation();

  // Helper para obtener el nombre de un servicio (puede ser string u objeto)
  const getServiceName = (service) => {
    if (!service) return '';
    if (typeof service === 'string') return service;
    // Si es objeto, extraer nombre o serviceType
    return service.name || service.serviceType || service.service_type || '';
  };

  // Renderiza el ícono de categoría usando Heroicons.
  // Los nombres guardados en DB (utensils, building, truck, etc.) NO son
  // nombres válidos de Material Icons; usamos el mismo mapeo que LocationTree
  // a componentes de Heroicons.
  const renderCategoryIcon = (sizeClass = 'w-6 h-6') => {
    const iconName = categoryInfo?.icon;
    const Icon = getCategoryIconComponent(iconName);
    return <Icon className={sizeClass} />;
  };

  // Mapea el color hex de la DB a un nombre Tailwind
  const getCategoryColor = () => {
    const hex = categoryInfo?.color?.toLowerCase();
    if (!hex) return 'gray';
    const hexToTailwind = {
      '#2196f3': 'blue',
      '#ff9800': 'orange',
      '#4caf50': 'green',
      '#9c27b0': 'purple',
      '#ff5722': 'orange',
      '#e91e63': 'pink',
      '#f44336': 'red',
      '#00bcd4': 'teal',
      '#3f51b5': 'indigo',
      '#607d8b': 'gray'
    };
    return hexToTailwind[hex] || 'gray';
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <StarIcon key={i} className="w-4 h-4 text-yellow-400 fill-current" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <StarIcon key="half" className="w-4 h-4 text-yellow-400 fill-current opacity-50" />
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <StarIcon key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
      );
    }

    return stars;
  };

  if (layout === 'list') {
    const categoryColor = getCategoryColor();
    const categoryName = categoryInfo?.name ? t(categoryInfo.name) : t('providers.card.noCategory');

    const colorClasses = {
      blue: { badge: 'bg-blue-100 text-blue-800' },
      orange: { badge: 'bg-orange-100 text-orange-800' },
      green: { badge: 'bg-green-100 text-green-800' },
      purple: { badge: 'bg-purple-100 text-purple-800' },
      pink: { badge: 'bg-pink-100 text-pink-800' },
      red: { badge: 'bg-red-100 text-red-800' },
      teal: { badge: 'bg-teal-100 text-teal-800' },
      indigo: { badge: 'bg-indigo-100 text-indigo-800' },
      gray: { badge: 'bg-gray-100 text-gray-800' }
    };
    const colors = colorClasses[categoryColor] || colorClasses.gray;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Icono de categoría */}
          <div className="flex-shrink-0">
            <div className={`w-14 h-14 rounded-xl ${colors.badge} flex items-center justify-center shadow-sm`}>
              {renderCategoryIcon('w-7 h-7')}
            </div>
          </div>

          {/* Información principal */}
          <div className="flex-1 min-w-0">
            {/* Nombre y estado */}
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-bold text-gray-900 truncate">
                {provider.name}
              </h3>
              <span className={`px-2.5 py-1 text-xs font-bold rounded-full flex-shrink-0 ${
                provider.status === 'active'
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-400 text-white'
              }`}>
                {provider.status === 'active' ? t('providers.status.active') : t('providers.status.inactive')}
              </span>
            </div>

            {/* Metadatos */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
              <span className="flex items-center">
                <MapPinIcon className="w-4 h-4 mr-1" />
                {locationName || t('providers.card.noLocation')}
              </span>
              <span className="flex items-center">
                <span className="mr-1 inline-flex">{renderCategoryIcon('w-4 h-4')}</span>
                {categoryName}
              </span>
              <span className="flex items-center font-semibold text-yellow-600">
                <StarIconSolid className="w-4 h-4 mr-1 text-yellow-400" />
                {provider.rating?.toFixed(1) || '0.0'}
              </span>
              {provider.capacity && (
                <span className="flex items-center">
                  {provider.capacity} {t('providers.card.people')}
                </span>
              )}
            </div>

            {/* Servicios en línea */}
            {provider.services && provider.services.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {provider.services.filter(s => s).slice(0, 3).map((service, index) => (
                  <span
                    key={index}
                    className={`inline-block px-2 py-0.5 text-xs font-medium ${colors.badge} rounded`}
                  >
                    {getServiceName(service)}
                  </span>
                ))}
                {provider.services.length > 3 && (
                  <span className="inline-block px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded">
                    +{provider.services.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Contacto */}
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-medium text-gray-900 mb-1">
              {provider.contact.contactPerson}
            </div>
            <div className="flex items-center justify-end text-xs text-gray-500">
              <PhoneIcon className="w-3 h-3 mr-1" />
              {provider.contact.phone}
            </div>
          </div>

          {/* Acciones — solo visibles si el usuario puede gestionar */}
          {canManage && (
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button
                onClick={() => onEdit()}
                className="p-2 text-blue-700 hover:bg-blue-50 bg-blue-50/50 rounded-lg transition-colors"
                title={t('common.edit')}
              >
                <PencilIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete()}
                className="p-2 text-red-700 hover:bg-red-50 bg-red-50/50 rounded-lg transition-colors"
                title={t('common.delete')}
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Layout tipo card (por defecto)
  const categoryColor = getCategoryColor();
  const categoryName = categoryInfo?.name ? t(categoryInfo.name) : t('providers.card.noCategory');

  // Clases de color dinámicas (usando SafeList approach)
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      badge: 'bg-blue-100 text-blue-800'
    },
    orange: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      badge: 'bg-orange-100 text-orange-800'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      badge: 'bg-green-100 text-green-800'
    },
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-700',
      badge: 'bg-purple-100 text-purple-800'
    },
    pink: {
      bg: 'bg-pink-50',
      border: 'border-pink-200',
      text: 'text-pink-700',
      badge: 'bg-pink-100 text-pink-800'
    },
    red: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      badge: 'bg-red-100 text-red-800'
    },
    teal: {
      bg: 'bg-teal-50',
      border: 'border-teal-200',
      text: 'text-teal-700',
      badge: 'bg-teal-100 text-teal-800'
    },
    indigo: {
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
      text: 'text-indigo-700',
      badge: 'bg-indigo-100 text-indigo-800'
    },
    gray: {
      bg: 'bg-gray-50',
      border: 'border-gray-200',
      text: 'text-gray-700',
      badge: 'bg-gray-100 text-gray-800'
    }
  };

  const colors = colorClasses[categoryColor] || colorClasses.gray;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300 overflow-hidden group">
      {/* Header con categoría mejorado */}
      <div className={`${colors.bg} ${colors.border} border-b-2 p-4`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`${colors.badge} w-12 h-12 rounded-xl flex items-center justify-center shadow-sm`}>
              {renderCategoryIcon('w-6 h-6')}
            </div>
            <div>
              <span className={`${colors.text} text-xs font-semibold uppercase tracking-wide`}>
                {categoryName}
              </span>
              <p className="text-xs text-gray-600 flex items-center mt-1">
                <MapPinIcon className="w-3 h-3 mr-1" />
                {locationName || t('providers.card.noLocation')}
              </p>
            </div>
          </div>

          <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-sm ${
            provider.status === 'active'
              ? 'bg-green-500 text-white'
              : 'bg-gray-400 text-white'
          }`}>
            {provider.status === 'active' ? t('providers.status.active') : t('providers.status.inactive')}
          </span>
        </div>

        {/* Nombre del proveedor */}
        <h4 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
          {provider.name}
        </h4>

        {/* Rating con estrellas */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            {renderStars(provider.rating)}
          </div>
          <span className="text-sm font-semibold text-gray-700">
            {provider.rating?.toFixed(1) || '0.0'}
          </span>
          <span className="text-xs text-gray-500">/ 5</span>
        </div>
      </div>

      {/* Contenido principal rediseñado */}
      <div className="p-4 space-y-4">
        {/* Observaciones */}
        {provider.observations && (
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
            <h5 className="text-xs font-bold text-gray-700 mb-1 uppercase tracking-wide">{t('providers.form.sections.observations')}</h5>
            <p className="text-sm text-gray-600 line-clamp-2">{provider.observations}</p>
          </div>
        )}

        {/* Servicios */}
        {provider.services && provider.services.length > 0 && (
          <div>
            <h5 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">{t('providers.form.sections.services')}</h5>
            <div className="flex flex-wrap gap-1.5">
              {provider.services.filter(s => s).slice(0, 3).map((service, index) => (
                <span
                  key={index}
                  className={`inline-block px-2.5 py-1 text-xs font-medium ${colors.badge} rounded-md`}
                >
                  {getServiceName(service)}
                </span>
              ))}
              {provider.services.length > 3 && (
                <span className="inline-block px-2.5 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded-md">
                  +{provider.services.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Especialidades */}
        {provider.specialties && provider.specialties.length > 0 && (
          <div>
            <h5 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">{t('providers.card.specialties')}</h5>
            <div className="flex flex-wrap gap-1.5">
              {provider.specialties.slice(0, 3).map((specialty, index) => (
                <span
                  key={index}
                  className="inline-block px-2.5 py-1 text-xs font-medium bg-indigo-100 text-indigo-700 rounded-md"
                >
                  {specialty}
                </span>
              ))}
              {provider.specialties.length > 3 && (
                <span className="inline-block px-2.5 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded-md">
                  +{provider.specialties.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Idiomas */}
        {provider.languages && provider.languages.length > 0 && (
          <div>
            <h5 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">{t('providers.card.languages')}</h5>
            <div className="flex flex-wrap gap-1.5">
              {provider.languages.map((language, index) => (
                <span
                  key={index}
                  className="inline-block px-2.5 py-1 text-xs font-medium bg-teal-100 text-teal-700 rounded-md"
                >
                  {language}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Contacto compacto */}
        <div className="pt-3 border-t border-gray-200">
          <h5 className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">{t('providers.form.sections.contactInfo')}</h5>
          <div className="space-y-1.5">
            <div className="flex items-center text-xs text-gray-600">
              <PhoneIcon className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
              <span className="truncate">{provider.contact.phone}</span>
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <EnvelopeIcon className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
              <span className="truncate">{provider.contact.email}</span>
            </div>
            <div className="text-xs font-medium text-gray-900">
              {provider.contact.contactPerson}
            </div>
          </div>
        </div>
      </div>

      {/* Footer con acciones mejorado — solo visible si el usuario puede gestionar */}
      {canManage && (
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-2">
          <button
            onClick={() => onEdit()}
            className="flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            title={t('common.edit')}
          >
            <PencilIcon className="w-4 h-4 mr-1.5" />
            {t('common.edit')}
          </button>

          <button
            onClick={() => onDelete()}
            className="flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            title={t('common.delete')}
          >
            <TrashIcon className="w-4 h-4 mr-1.5" />
            {t('common.delete')}
          </button>
        </div>
      )}
    </div>
  );
};

export default ProviderCard;