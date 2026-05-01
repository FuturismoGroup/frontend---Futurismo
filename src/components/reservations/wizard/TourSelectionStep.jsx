import { CalendarIcon, ClockIcon, CurrencyDollarIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { formatters } from '../../../utils/formatters';
// Tour types constants
const TOUR_TYPES = {
  REGULAR: 'regular',
  FULLDAY: 'fullday'
};

const TourSelectionStep = ({ 
  register, 
  errors, 
  watch, 
  availableTours,
  isFulldayTour,
  canBookDirectReservation 
}) => {
  const { t } = useTranslation();
  const selectedTourId = watch('tourId');
  const selectedTour = availableTours.find(t => t.id === selectedTourId);

  return (
    <div className="space-y-6">
      {/* Tipo de servicio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('reservations.serviceType')}
        </label>
        <select
          {...register('serviceType')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="tour">{t('reservations.guidedTour')}</option>
          <option value="transfer">{t('reservations.transfer')}</option>
          <option value="custom">{t('reservations.customService')}</option>
        </select>
        {errors.serviceType && (
          <p className="mt-1 text-sm text-red-600">{errors.serviceType.message}</p>
        )}
      </div>

      {/* Selección de tour */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('reservations.selectTour')}
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {availableTours.map((tour) => (
            <label
              key={tour.id}
              className={`
                relative flex cursor-pointer rounded-lg border p-4 focus:outline-none
                ${selectedTourId === tour.id 
                  ? 'border-primary-500 ring-2 ring-primary-500' 
                  : 'border-gray-300'
                }
              `}
            >
              <input
                type="radio"
                {...register('tourId')}
                value={tour.id}
                className="sr-only"
              />
              <div className="flex flex-1">
                <div className="flex flex-col">
                  <span className="block text-sm font-medium text-gray-900">
                    {tour.name}
                  </span>
                  <span className="mt-1 flex items-center text-sm text-gray-500">
                    <ClockIcon className="mr-1 h-4 w-4" />
                    {tour.duration} {t('common.hours')}
                  </span>
                  <span className="mt-2 text-lg font-semibold text-primary-600">
                    S/. {tour.price} {t('common.perPerson')}
                  </span>
                  {tour.type === TOUR_TYPES.FULLDAY && (
                    <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {t('reservations.fullDay')}
                    </span>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>
        {errors.tourId && (
          <p className="mt-1 text-sm text-red-600">{errors.tourId.message}</p>
        )}
      </div>

      {/* Alerta para tours fullday después de las 5pm */}
      {isFulldayTour && !canBookDirectReservation && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                {t('reservations.fulldayRestriction')}
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                {t('reservations.fulldayRestrictionMessage')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fecha y hora */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <CalendarIcon className="inline-block w-4 h-4 mr-1" />
            {t('common.date')}
          </label>
          <input
            type="date"
            {...register('date')}
            min={formatters.date(new Date())}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <ClockIcon className="inline-block w-4 h-4 mr-1" />
            {t('common.time')}
          </label>
          <select
            {...register('time')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">{t('common.selectTime')}</option>
            <option value="06:00">06:00 AM</option>
            <option value="07:00">07:00 AM</option>
            <option value="08:00">08:00 AM</option>
            <option value="09:00">09:00 AM</option>
            <option value="10:00">10:00 AM</option>
            <option value="11:00">11:00 AM</option>
            <option value="12:00">12:00 PM</option>
            <option value="13:00">01:00 PM</option>
            <option value="14:00">02:00 PM</option>
            <option value="15:00">03:00 PM</option>
            <option value="16:00">04:00 PM</option>
            <option value="17:00">05:00 PM</option>
            <option value="18:00">06:00 PM</option>
            <option value="19:00">07:00 PM</option>
          </select>
          {errors.time && (
            <p className="mt-1 text-sm text-red-600">{errors.time.message}</p>
          )}
        </div>
      </div>

      {/* Resumen del tour seleccionado */}
      {selectedTour && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-2">{t('reservations.tourSummary')}</h4>
          <div className="space-y-1 text-sm text-gray-600">
            <p>{t('reservations.tour')}: <span className="font-medium text-gray-900">{selectedTour.name}</span></p>
            <p>{t('reservations.duration')}: <span className="font-medium text-gray-900">{selectedTour.duration} {t('common.hours')}</span></p>
            <p>{t('reservations.pricePerPerson')}: <span className="font-medium text-gray-900">S/. {selectedTour.price}</span></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourSelectionStep;