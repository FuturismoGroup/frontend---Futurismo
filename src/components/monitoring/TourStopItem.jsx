import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircleIcon, 
  MapPinIcon, 
  ClockIcon, 
  ChevronRightIcon, 
  ExclamationTriangleIcon,
  CameraIcon,
  EllipsisHorizontalCircleIcon,
  PlayIcon,
  StopIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { formatters } from '../../utils/formatters';
import { resolveFileUrl } from '../../utils/fileUrl';
import PhotoUpload from '../common/PhotoUpload';
import TourPhotoUpload from './TourPhotoUpload';
import { TOUR_STATUS, MAX_PHOTOS_PER_STOP } from '../../constants/monitoringConstants';

const TourStopItem = ({ 
  stop, 
  index, 
  totalStops,
  isExpanded, 
  onToggle, 
  canUploadPhotos,
  onPhotosChange,
  // Nuevas props para interactividad
  onCheckIn,
  onCheckOut,
  onReportIncident,
  canCheckIn,
  canCheckOut
}) => {
  const { t } = useTranslation();

  const getStopIcon = (status) => {
    switch (status) {
      case TOUR_STATUS.COMPLETED:
        return <CheckCircleIcon className="w-6 h-6 text-green-600" />;
      case TOUR_STATUS.IN_PROGRESS:
        return <EllipsisHorizontalCircleIcon className="w-6 h-6 text-blue-600 animate-pulse" />;
      case TOUR_STATUS.PENDING:
        return <EllipsisHorizontalCircleIcon className="w-6 h-6 text-gray-400" />;
      default:
        return <EllipsisHorizontalCircleIcon className="w-6 h-6 text-gray-400" />;
    }
  };

  return (
    <div>
      <div
        className={`flex items-start gap-4 cursor-pointer p-4 rounded-lg hover:bg-gray-50 transition-colors ${
          isExpanded ? 'bg-gray-50' : ''
        }`}
        onClick={onToggle}
      >
        <div className="relative">
          {getStopIcon(stop.status)}
          {index < totalStops - 1 && (
            <div className={`absolute top-8 left-3 w-0.5 h-16 ${
              stop.status === TOUR_STATUS.COMPLETED ? 'bg-green-300' : 'bg-gray-300'
            }`} />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h5 className="font-semibold">{stop.name}</h5>
              <p className="text-sm text-gray-600 mt-1">{stop.description}</p>
              
              <div className="flex items-center gap-4 mt-2 text-sm">
                {stop.arrivalTime && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <MapPinIcon className="w-4 h-4" />
                    <span>{t('monitoring.tour.arrival')}: {formatters.formatTime(stop.arrivalTime)}</span>
                  </div>
                )}
                {stop.actualTime && (
                  <div className="flex items-center gap-1 text-gray-500">
                    <ClockIcon className="w-4 h-4" />
                    <span>{stop.actualTime} {t('monitoring.tour.minutes')}</span>
                  </div>
                )}
              </div>

              {stop.incidents.length > 0 && (
                <div className="mt-2 p-2 bg-yellow-50 rounded text-sm text-yellow-800">
                  <ExclamationTriangleIcon className="w-4 h-4 inline mr-1" />
                  {stop.incidents[0].message}
                </div>
              )}
            </div>

            <ChevronRightIcon className={`w-5 h-5 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`} />
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="ml-10 pl-4 pb-4 border-l-2 border-gray-200">
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">{t('monitoring.tour.estimatedTime')}</p>
                <p className="font-medium">{stop.estimatedTime} {t('monitoring.tour.minutes')}</p>
              </div>
              <div>
                <p className="text-gray-600">{t('monitoring.tour.actualTime')}</p>
                <p className="font-medium">{stop.actualTime || '-'} {t('monitoring.tour.minutes')}</p>
              </div>
              {stop.departureTime && (
                <>
                  <div>
                    <p className="text-gray-600">{t('monitoring.tour.arrivalTime')}</p>
                    <p className="font-medium">{formatters.formatTime(stop.arrivalTime)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">{t('monitoring.tour.departureTime')}</p>
                    <p className="font-medium">{formatters.formatTime(stop.departureTime)}</p>
                  </div>
                </>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-gray-700">
                  {t('monitoring.tour.stopPhotos')} {canUploadPhotos(stop) && t('monitoring.tour.optional')}
                </p>
                {stop.photos.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {stop.photos.length} {t('monitoring.tour.photo', { count: stop.photos.length })}
                  </span>
                )}
              </div>

              {canUploadPhotos(stop) ? (
                <div className="space-y-4">
                  {/* Sistema nuevo de fotos con geolocalización */}
                  <TourPhotoUpload
                    stopId={stop.id}
                    stopName={stop.name}
                    requiredLocation={stop.coordinates}
                    isRequired={stop.isRequired || false}
                    onPhotoUploaded={(photoData) => {
                      const newPhotos = [...(stop.photos || []), photoData];
                      onPhotosChange(stop.id, newPhotos);
                    }}
                  />
                  
                  {/* Sistema original como fallback */}
                  <details className="mt-4">
                    <summary className="text-sm text-gray-600 cursor-pointer hover:text-gray-800">
                      {t('monitoring.comp.uploadFromGallery')}
                    </summary>
                    <div className="mt-2">
                      <PhotoUpload
                        photos={stop.photos}
                        onPhotosChange={(newPhotos) => onPhotosChange(stop.id, newPhotos)}
                        maxPhotos={MAX_PHOTOS_PER_STOP}
                      />
                    </div>
                  </details>
                </div>
              ) : (
                <>
                  {stop.photos.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {stop.photos.map((photo) => (
                        <div key={photo.id} className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={resolveFileUrl(photo.url)}
                            alt={photo.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500 border-2 border-dashed border-gray-200 rounded-lg">
                      <CameraIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">{t('monitoring.tour.noPhotos')}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {stop.status === TOUR_STATUS.PENDING && (
              <div className="text-sm text-gray-500">
                <p>{t('monitoring.tour.notVisitedYet')}</p>
              </div>
            )}

            {/* BOTONES INTERACTIVOS PARA GUÍAS */}
            {(canCheckIn || canCheckOut || onReportIncident) && (
              <div className="pt-3 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {canCheckIn && canCheckIn(stop) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCheckIn(stop.id);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <PlayIcon className="w-4 h-4" />
                        {t('monitoring.tour.checkIn')}
                      </button>
                    )}

                    {canCheckOut && canCheckOut(stop) && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onCheckOut(stop.id);
                        }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <StopIcon className="w-4 h-4" />
                        {t('monitoring.tour.checkOut')}
                      </button>
                    )}

                    {stop.status === TOUR_STATUS.IN_PROGRESS && (
                      <div className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        {t('monitoring.tour.inProgress')}
                      </div>
                    )}
                  </div>

                  {onReportIncident && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const message = prompt(t('monitoring.tour.incidentPrompt'));
                        if (message && message.trim()) {
                          onReportIncident(stop.id, 'custom', message.trim());
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-yellow-700 hover:text-yellow-800 hover:bg-yellow-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      title={t('monitoring.tour.reportIncident')}
                    >
                      <ExclamationCircleIcon className="w-3 h-3" />
                      {t('monitoring.tour.reportIncident')}
                    </button>
                  )}
                </div>

                {/* Mostrar tiempo transcurrido si está en progreso */}
                {stop.status === TOUR_STATUS.IN_PROGRESS && stop.arrivalTime && (
                  <div className="mt-2 text-xs text-gray-500">
                    {t('monitoring.tour.timeElapsed')}: {Math.round((new Date() - new Date(stop.arrivalTime)) / 60000)} {t('monitoring.tour.minutes')}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

TourStopItem.propTypes = {
  stop: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
  totalStops: PropTypes.number.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  canUploadPhotos: PropTypes.func.isRequired,
  onPhotosChange: PropTypes.func.isRequired,
  // Nuevas props para interactividad
  onCheckIn: PropTypes.func,
  onCheckOut: PropTypes.func,
  onReportIncident: PropTypes.func,
  canCheckIn: PropTypes.func,
  canCheckOut: PropTypes.func
};

export default TourStopItem;