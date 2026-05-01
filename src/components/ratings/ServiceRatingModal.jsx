import { useState } from 'react';
import { XMarkIcon, UserGroupIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import TouristRating from './TouristRating';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { RATING_STEPS, UI_DELAYS, TOURIST_RATING_VALUES } from '../../constants/ratingsConstants';

const ServiceRatingModal = ({ 
  isOpen, 
  onClose, 
  service, 
  tourists = [], 
  onAllRatingsCompleted 
}) => {
  const [completedRatings, setCompletedRatings] = useState(new Set());
  const [allRatings, setAllRatings] = useState({});
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(RATING_STEPS.RATING);

  if (!isOpen) return null;

  const handleRatingSubmitted = (touristId, ratingData) => {
    setCompletedRatings(prev => new Set([...prev, touristId]));
    setAllRatings(prev => ({ ...prev, [touristId]: ratingData }));
    
    // Si todos los turistas han sido valorados, mostrar resumen
    if (completedRatings.size + 1 === tourists.length) {
      setTimeout(() => {
        setCurrentStep(RATING_STEPS.SUMMARY);
      }, UI_DELAYS.STEP_TRANSITION);
    }
  };

  const handleFinishRatings = () => {
    if (onAllRatingsCompleted) {
      onAllRatingsCompleted(allRatings);
    }
    onClose();
    toast.success(t('ratings.service.allRatingsCompleted'));
  };

  const getRatingStats = () => {
    const ratings = Object.values(allRatings);
    return {
      excellent: ratings.filter(r => r.rating === TOURIST_RATING_VALUES.EXCELLENT).length,
      good: ratings.filter(r => r.rating === TOURIST_RATING_VALUES.GOOD).length,
      poor: ratings.filter(r => r.rating === TOURIST_RATING_VALUES.POOR).length,
      total: ratings.length
    };
  };

  const stats = getRatingStats();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          
          {/* Header */}
          <div className="bg-white px-6 pt-6 pb-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserGroupIcon className="w-6 h-6 text-primary-500" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Valorar Experiencia de Turistas
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Servicio: <span className="font-medium">{service?.name || 'Tour'}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 p-2 rounded-md hover:bg-gray-100"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between items-center text-sm mb-2">
                <span className="text-gray-600">Progreso de valoraciones</span>
                <span className="font-medium">
                  {completedRatings.size}/{tourists.length} completados
                </span>
              </div>
              <div className="bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(completedRatings.size / tourists.length) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {currentStep === 'rating' && (
            <div className="bg-white px-6 py-6 max-h-96 overflow-y-auto">
              <div className="space-y-6">
                {tourists.map((tourist, index) => {
                  const isCompleted = completedRatings.has(tourist.id);
                  
                  return (
                    <div key={tourist.id} className="relative">
                      {/* Tourist Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            isCompleted 
                              ? 'bg-green-500 text-white' 
                              : 'bg-gray-200 text-gray-600'
                          }`}>
                            {isCompleted ? (
                              <CheckCircleIcon className="w-5 h-5" />
                            ) : (
                              index + 1
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {tourist.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {tourist.documentType}: {tourist.documentNumber}
                          </p>
                        </div>
                        {isCompleted && (
                          <div className="ml-auto">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✅ Valorado
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Rating Component */}
                      {!isCompleted ? (
                        <TouristRating
                          touristId={tourist.id}
                          touristName={tourist.name}
                          serviceId={service?.id}
                          onRatingSubmitted={(ratingData) => handleRatingSubmitted(tourist.id, ratingData)}
                          showComments={false} // Simplicado para modal
                        />
                      ) : (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div className="flex items-center gap-2 text-green-800">
                            <CheckCircleIcon className="w-5 h-5" />
                            <span className="font-medium">
                              Valoración: {allRatings[tourist.id]?.rating === 'excellent' ? '😊 Excelente' :
                                           allRatings[tourist.id]?.rating === 'good' ? '👍 Bueno' : '😞 Regular'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Separator */}
                      {index < tourists.length - 1 && (
                        <div className="border-t border-gray-200 mt-6"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === 'summary' && (
            <div className="bg-white px-6 py-6">
              <div className="text-center mb-6">
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  ¡Valoraciones Completadas!
                </h3>
                <p className="text-gray-600">
                  Has valorado la experiencia de todos los turistas
                </p>
              </div>

              {/* Rating Summary */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-gray-900 mb-4 text-center">
                  Resumen de Valoraciones
                </h4>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {stats.excellent}
                    </div>
                    <div className="text-sm text-gray-600">😊 Excelente</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {stats.good}
                    </div>
                    <div className="text-sm text-gray-600">👍 Bueno</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 mb-1">
                      {stats.poor}
                    </div>
                    <div className="text-sm text-gray-600">😞 Regular</div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Total valorados:</span> {stats.total} turistas
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setCurrentStep('rating')}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Revisar Valoraciones
                </button>
                <button
                  onClick={handleFinishRatings}
                  className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 flex items-center gap-2"
                >
                  <CheckCircleIcon className="w-4 h-4" />
                  Finalizar y Guardar
                </button>
              </div>
            </div>
          )}

          {/* Footer Info */}
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <ClockIcon className="w-4 h-4" />
              <span>
                Las valoraciones ayudan a mejorar la calidad del servicio y la experiencia del cliente
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceRatingModal;