import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { 
  ClockIcon, 
  UserGroupIcon, 
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { formatters } from '../../utils/formatters';

const TourHeader = ({ tour, estimatedDelay, progressPercentage }) => {
  const { t } = useTranslation();

  return (
    <div className="p-6 border-b border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">{tour.name}</h3>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <ClockIcon className="w-4 h-4" />
              <span>{t('monitoring.tour.startTime')}: {formatters.formatTime(tour.actualStartTime)}</span>
            </div>
            <div className="flex items-center gap-1">
              <UserGroupIcon className="w-4 h-4" />
              <span>
                {tour.tourists?.present || 0}/{tour.tourists?.total || 0} {t('monitoring.tour.tourists')}
              </span>
            </div>
            {estimatedDelay > 0 && (
              <div className="flex items-center gap-1 text-yellow-600">
                <ExclamationTriangleIcon className="w-4 h-4" />
                <span>{t('monitoring.tour.delay', { minutes: Math.round(estimatedDelay) })}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="btn btn-primary flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="w-4 h-4" />
            {t('monitoring.tour.sendMessage')}
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between items-center text-sm mb-2">
          <span className="text-gray-600">{t('monitoring.tour.progress')}</span>
          <span className="font-medium">{Math.round(progressPercentage)}% {t('monitoring.tour.completed')}</span>
        </div>
        <div className="bg-gray-200 rounded-full h-3">
          <div
            className="bg-primary-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

TourHeader.propTypes = {
  tour: PropTypes.object.isRequired,
  estimatedDelay: PropTypes.number.isRequired,
  progressPercentage: PropTypes.number.isRequired
};

export default TourHeader;