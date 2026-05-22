import { UserGroupIcon, MapPinIcon, UserPlusIcon, TrashIcon, PlusIcon, UserIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const PassengerInfoStep = ({
  register,
  errors,
  watch,
  fields,
  append,
  remove,
  setValue,
  selectedTour
}) => {
  const { t } = useTranslation();

  // Calcular totales desde los watches individuales de cada campo (evita desincronización)
  const totalAdults = fields.reduce((sum, _field, index) => {
    return sum + (parseInt(watch(`groups.${index}.adultsCount`)) || 0);
  }, 0);
  const totalChildren = fields.reduce((sum, _field, index) => {
    return sum + (parseInt(watch(`groups.${index}.childrenCount`)) || 0);
  }, 0);
  const totalPassengers = totalAdults + totalChildren;

  return (
    <div className="space-y-6">
      {/* Información del tour */}
      {selectedTour && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="font-medium text-blue-900">
            {selectedTour.name}
          </h4>
          <p className="text-sm text-blue-700 mt-1">
            {t('reservations.date')}: {watch('date')} - {watch('time')}
          </p>
        </div>
      )}

      {/* Resumen de pasajeros (solo lectura, calculado desde grupos) */}
      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
        <h3 className="text-lg font-medium text-indigo-900 mb-2">
          <UserGroupIcon className="inline-block w-5 h-5 mr-2" />
          {t('reservations.passengers')}
        </h3>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-indigo-600">{t('reservations.adults')}:</span>
            <span className="font-bold text-indigo-900 ml-1">{totalAdults}</span>
          </div>
          <div>
            <span className="text-indigo-600">{t('reservations.children')}:</span>
            <span className="font-bold text-indigo-900 ml-1">{totalChildren}</span>
          </div>
          <div>
            <span className="text-indigo-600">Total:</span>
            <span className="font-bold text-indigo-900 ml-1">{totalPassengers}</span>
          </div>
        </div>
        {totalAdults === 0 && fields.length > 0 && (
          <p className="mt-2 text-sm text-red-600 font-medium">
            {t('reservations.minOneAdult')}
          </p>
        )}
      </div>

      {/* Grupos de la reserva */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            <UserPlusIcon className="inline-block w-5 h-5 mr-2" />
            {t('reservations.reservationGroups')}
          </h3>
        </div>

        <div className="space-y-4">
          {fields.map((field, index) => {
            const groupAdults = parseInt(watch(`groups.${index}.adultsCount`)) || 0;
            const groupChildren = parseInt(watch(`groups.${index}.childrenCount`)) || 0;
            const groupTotal = groupAdults + groupChildren;

            return (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">
                    {t('reservations.group')} {index + 1}
                  </h4>
                  {fields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => remove(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <UserIcon className="inline-block w-4 h-4 mr-1" />
                      {t('reservations.representative')}
                    </label>
                    <input
                      type="text"
                      {...register(`groups.${index}.representativeName`)}
                      placeholder={t('Nombre Completo')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.groups?.[index]?.representativeName && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.groups[index].representativeName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <PhoneIcon className="inline-block w-4 h-4 mr-1" />
                      {t('Teléfono')}
                    </label>
                    <input
                      type="tel"
                      {...register(`groups.${index}.representativePhone`, {
                        onChange: (e) => {
                          // Solo permitir dígitos y limitar a 9 caracteres
                          e.target.value = e.target.value.replace(/\D/g, '').slice(0, 9);
                        }
                      })}
                      onKeyPress={(e) => {
                        if (!/[0-9]/.test(e.key)) {
                          e.preventDefault();
                        }
                      }}
                      onPaste={(e) => {
                        e.preventDefault();
                        const pastedText = e.clipboardData.getData('text');
                        const numbersOnly = pastedText.replace(/\D/g, '').slice(0, 9);
                        e.target.value = numbersOnly;
                        e.target.dispatchEvent(new Event('input', { bubbles: true }));
                      }}
                      maxLength={9}
                      inputMode="numeric"
                      placeholder="9XXXXXXXX"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.groups?.[index]?.representativePhone && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.groups[index].representativePhone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('reservations.adultsInGroup')}
                    </label>
                    <input
                      type="number"
                      {...register(`groups.${index}.adultsCount`, { valueAsNumber: true })}
                      placeholder="1"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.groups?.[index]?.adultsCount && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.groups[index].adultsCount.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('reservations.childrenInGroup')}
                    </label>
                    <input
                      type="number"
                      {...register(`groups.${index}.childrenCount`, { valueAsNumber: true })}
                      placeholder="0"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {errors.groups?.[index]?.childrenCount && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.groups[index].childrenCount.message}
                      </p>
                    )}
                  </div>
                </div>

                <p className="mt-2 text-sm text-gray-500">
                  {t('reservations.groupSummary', {
                    adults: groupAdults,
                    children: groupChildren,
                    total: groupTotal
                  })}
                </p>
              </div>
            );
          })}

          <button
            type="button"
            onClick={() => append({
              representativeName: '',
              representativePhone: '',
              adultsCount: 1,
              childrenCount: 0
            })}
            className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700"
          >
            <PlusIcon className="inline-block w-4 h-4 mr-2" />
            {t('reservations.addGroup')}
          </button>
        </div>
      </div>

      {/* Lugar de recojo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPinIcon className="inline-block w-4 h-4 mr-1" />
          {t('reservations.pickupLocation')}
        </label>
        <input
          type="text"
          {...register('pickupLocation')}
          placeholder={t('reservations.pickupLocationPlaceholder')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
        {errors.pickupLocation && (
          <p className="mt-1 text-sm text-red-600">{errors.pickupLocation.message}</p>
        )}
      </div>

      {/* Requerimientos especiales */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('reservations.specialRequirements')}
        </label>
        <textarea
          {...register('specialRequirements')}
          rows="3"
          placeholder={t('reservations.specialRequirementsPlaceholder')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
    </div>
  );
};

export default PassengerInfoStep;
