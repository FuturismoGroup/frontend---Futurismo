import { useState } from 'react';
import { FaceSmileIcon, FaceFrownIcon, HandThumbUpIcon, HandThumbDownIcon, HeartIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { FaceSmileIcon as FaceSmileSolid, FaceFrownIcon as FaceFrownSolid, HandThumbUpIcon as HandThumbUpSolid, HandThumbDownIcon as HandThumbDownSolid, HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import {
  TOURIST_RATING_VALUES,
  RATING_ICONS,
  RATING_COLORS,
  RATED_BY_TYPES
} from '../../constants/ratingsConstants';

const TouristRating = ({ 
  touristId, 
  touristName, 
  serviceId, 
  onRatingSubmitted, 
  existingRating = null,
  showComments = true 
}) => {
  const { t } = useTranslation();
  const [selectedRating, setSelectedRating] = useState(existingRating?.rating || null);
  const [comments, setComments] = useState(existingRating?.comments || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ratingOptions = [
    {
      value: TOURIST_RATING_VALUES.EXCELLENT,
      label: `${RATING_ICONS.EXCELLENT} ${t('ratings.tourist.excellent')}`,
      description: t('ratings.tourist.excellentDescription'),
      color: RATING_COLORS.EXCELLENT.text,
      bgColor: RATING_COLORS.EXCELLENT.bg,
      selectedBg: RATING_COLORS.EXCELLENT.selected,
      icon: FaceSmileIcon,
      iconSolid: FaceSmileSolid
    },
    {
      value: TOURIST_RATING_VALUES.GOOD,
      label: `${RATING_ICONS.GOOD} ${t('ratings.tourist.good')}`,
      description: t('ratings.tourist.goodDescription'),
      color: RATING_COLORS.GOOD.text,
      bgColor: RATING_COLORS.GOOD.bg,
      selectedBg: RATING_COLORS.GOOD.selected,
      icon: HandThumbUpIcon,
      iconSolid: HandThumbUpSolid
    },
    {
      value: TOURIST_RATING_VALUES.POOR,
      label: `${RATING_ICONS.POOR} ${t('ratings.tourist.poor')}`,
      description: t('ratings.tourist.poorDescription'),
      color: RATING_COLORS.POOR.text,
      bgColor: RATING_COLORS.POOR.bg,
      selectedBg: RATING_COLORS.POOR.selected,
      icon: FaceFrownIcon,
      iconSolid: FaceFrownSolid
    }
  ];

  const handleRatingSelect = (rating) => {
    setSelectedRating(rating);
  };

  const handleSubmit = async () => {
    if (!selectedRating) {
      toast.error(t('ratings.tourist.selectRatingError'));
      return;
    }

    setIsSubmitting(true);

    try {
      // ELM-363: Llamada real a API POST /api/ratings/tourists
      // Integrado 2025-11-28 - Eliminado mock con setTimeout
      const response = await api.post('/ratings/tourists', {
        touristId,
        serviceId,
        rating: selectedRating,
        comments: comments.trim() || null,
        touristName
      });

      if (response.data.success) {
        toast.success(t('ratings.tourist.ratingSubmittedSuccess'));

        // Construir ratingData desde respuesta del backend para callback
        const ratingData = {
          id: response.data.data.id,
          touristId: response.data.data.touristId,
          serviceId: response.data.data.serviceId,
          rating: response.data.data.rating,
          comments: response.data.data.comments,
          ratedBy: response.data.data.ratedBy,
          ratedAt: response.data.data.ratedAt,
          touristName: response.data.data.touristName
        };

        if (onRatingSubmitted) {
          onRatingSubmitted(ratingData);
        }
      } else {
        throw new Error(response.data.error || t('ratings.tourist.ratingSubmittedError'));
      }

    } catch (error) {
      console.error('Error en TouristRating.handleSubmit:', error);
      const errorMsg = error.response?.data?.error || t('ratings.tourist.ratingSubmittedError');
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedOption = ratingOptions.find(option => option.value === selectedRating);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <HeartIcon className="w-6 h-6 text-pink-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            {t('search.rateTourists')}
          </h3>
        </div>
        <p className="text-sm text-gray-600">
          <span className="font-medium">{touristName}</span> - {t('rating.modal.rateExperience')}
        </p>
      </div>

      {/* Rating Options */}
      <div className="space-y-3 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-3">
          {t('validation.selectRating', { defaultValue: 'Selecciona la valoración que mejor describa la experiencia:' })}
        </p>
        
        {ratingOptions.map((option) => {
          const Icon = selectedRating === option.value ? option.iconSolid : option.icon;
          const isSelected = selectedRating === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => handleRatingSelect(option.value)}
              className={`w-full p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                isSelected ? option.selectedBg : `${option.bgColor} border-gray-200`
              }`}
              disabled={isSubmitting}
            >
              <div className="flex items-center gap-4">
                <div className={`flex-shrink-0 ${isSelected ? 'text-white' : option.color}`}>
                  <Icon className="w-8 h-8" />
                </div>
                <div className="flex-1">
                  <div className={`font-semibold text-lg ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                    {option.label}
                  </div>
                  <div className={`text-sm ${isSelected ? 'text-white text-opacity-90' : 'text-gray-600'}`}>
                    {option.description}
                  </div>
                </div>
                {isSelected && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('rating.modal.comments')}
          </label>
          <textarea
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            placeholder={t('rating.modal.commentsPlaceholder')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            rows={3}
            maxLength={500}
            disabled={isSubmitting}
          />
          <div className="flex justify-between items-center mt-1">
            <p className="text-xs text-gray-500">
              {t('profile.comp.experiencePlaceholder', { defaultValue: 'Comparte detalles sobre la experiencia del turista...' })}
            </p>
            <span className="text-xs text-gray-400">
              {comments.length}/500
            </span>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <ExclamationTriangleIcon className="w-4 h-4" />
          <span>{t('ratings.dashboard.staffPerformanceTitle', { defaultValue: 'Esta valoración será registrada para análisis interno' })}</span>
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={!selectedRating || isSubmitting}
          className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {t('profile.comp.feedback.submitting')}
            </>
          ) : (
            <>
              <HeartSolid className="w-4 h-4" />
              {t('rating.modal.submit')}
            </>
          )}
        </button>
      </div>

      {/* Selected Rating Preview */}
      {selectedRating && !isSubmitting && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-600">{t('validation.selectRating', { defaultValue: 'Valoración seleccionada:' })}:</span>
            <span className={`font-semibold ${selectedOption?.color}`}>
              {selectedOption?.label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TouristRating;