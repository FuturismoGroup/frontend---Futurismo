import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import useTourProgress from '../../hooks/useTourProgress';
import TourHeader from './TourHeader';
import TourStopItem from './TourStopItem';
import { formatters } from '../../utils/formatters';

const TourProgress = ({ tourId, isGuideView = false }) => {
  const { t } = useTranslation();
  const {
    tour,
    expandedStop,
    progressPercentage,
    estimatedDelay,
    handlePhotosChange,
    canUploadPhotos,
    toggleStop,
    // Nuevas funciones interactivas
    handleCheckIn,
    handleCheckOut,
    reportIncident,
    canCheckIn,
    canCheckOut
  } = useTourProgress(tourId, isGuideView);

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <TourHeader 
        tour={tour}
        estimatedDelay={estimatedDelay}
        progressPercentage={progressPercentage}
      />

      <div className="p-6">
        <h4 className="font-semibold mb-4">{t('monitoring.tour.itinerary')}</h4>
        
        <div className="space-y-0">
          {tour.stops.map((stop, index) => (
            <TourStopItem
              key={stop.id}
              stop={stop}
              index={index}
              totalStops={tour.stops.length}
              isExpanded={expandedStop === stop.id}
              onToggle={() => toggleStop(stop.id)}
              canUploadPhotos={canUploadPhotos}
              onPhotosChange={handlePhotosChange}
              // Pasar las nuevas funciones interactivas
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
              onReportIncident={reportIncident}
              canCheckIn={canCheckIn}
              canCheckOut={canCheckOut}
            />
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                {t('monitoring.tour.estimatedEndTime')}
              </p>
              <p className="text-lg font-semibold text-blue-800">
                {formatters.formatTime(tour.estimatedEndTime)}
              </p>
            </div>
            {estimatedDelay > 0 && (
              <div className="text-right">
                <p className="text-sm text-blue-700">
                  {t('monitoring.tour.withCurrentDelay')}: {formatters.formatTime(
                    new Date(tour.estimatedEndTime.getTime() + (estimatedDelay * 60000))
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

TourProgress.propTypes = {
  tourId: PropTypes.string,
  isGuideView: PropTypes.bool
};

export default TourProgress;