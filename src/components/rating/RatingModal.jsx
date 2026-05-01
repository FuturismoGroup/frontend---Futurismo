import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, UserIcon, ClockIcon, MapPinIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import StarRating from '../common/StarRating';

const RatingModal = ({
  isOpen,
  onClose,
  onSubmit,
  service,
  type = 'service', // 'service', 'guide', 'tour'
  loading = false
}) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [errors, setErrors] = useState({});

  // Precargar calificación existente si ya fue calificado
  const alreadyRated = !!(service?.rating && service.rating > 0);

  useEffect(() => {
    if (isOpen && service) {
      if (alreadyRated) {
        setRating(service.rating);
        setComment(service.review_comment || '');
      } else {
        setRating(0);
        setComment('');
      }
      setErrors({});
    }
  }, [isOpen, service?.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validación
    const newErrors = {};
    if (rating === 0) {
      newErrors.rating = t('rating.errors.ratingRequired');
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Enviar calificación
    onSubmit({
      rating,
      comment: comment.trim(),
      serviceId: service?.id,
      type
    });

    // Limpiar formulario
    setRating(0);
    setComment('');
    setErrors({});
  };

  const handleClose = () => {
    setRating(0);
    setComment('');
    setErrors({});
    onClose();
  };

  if (!isOpen || !service) {
    return null;
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={handleClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={handleClose}
              disabled={loading}
            >
              <span className="sr-only">{t('common.close')}</span>
              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="w-full mt-3 text-center sm:mt-0 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                {type === 'service' && t('rating.modal.title.service')}
                {type === 'guide' && t('rating.modal.title.guide')}
                {type === 'tour' && t('rating.modal.title.tour')}
              </h3>

              {/* Aviso si ya fue calificado */}
              {alreadyRated && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="text-sm text-green-800">
                    {t('rating.modal.alreadyRated', 'Este servicio ya fue calificado.')}
                  </span>
                </div>
              )}

              {/* Información del servicio */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MapPinIcon className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900">
                      {service.serviceName}
                    </h4>
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center text-xs text-gray-500">
                        <ClockIcon className="w-3 h-3 mr-1" />
                        {formatDate(service.date)}
                      </div>
                      {service.guide && (
                        <div className="flex items-center text-xs text-gray-500">
                          <UserIcon className="w-3 h-3 mr-1" />
                          {t('rating.modal.guide')}: {service.guide}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Calificación con estrellas */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {t('rating.modal.rateExperience')}
                  </label>
                  <div className="flex justify-center">
                    <StarRating
                      rating={rating}
                      interactive={!alreadyRated}
                      size="xl"
                      onChange={alreadyRated ? undefined : setRating}
                      disabled={loading || alreadyRated}
                    />
                  </div>
                  {errors.rating && (
                    <p className="mt-2 text-sm text-red-600 text-center">{errors.rating}</p>
                  )}
                  
                  {/* Descripción del rating */}
                  {rating > 0 && (
                    <div className="text-center mt-2">
                      <span className="text-sm text-gray-600">
                        {rating === 1 && t('rating.modal.levels.terrible')}
                        {rating === 2 && t('rating.modal.levels.bad')}
                        {rating === 3 && t('rating.modal.levels.okay')}
                        {rating === 4 && t('rating.modal.levels.good')}
                        {rating === 5 && t('rating.modal.levels.excellent')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Comentarios */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('rating.modal.comments')}
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50"
                    placeholder={t('rating.modal.commentsPlaceholder')}
                    disabled={loading || alreadyRated}
                    maxLength={500}
                  />
                  <div className="mt-1 text-xs text-gray-500 text-right">
                    {comment.length}/500
                  </div>
                </div>

                {/* Botones */}
                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    onClick={handleClose}
                    disabled={loading}
                  >
                    {alreadyRated ? t('common.close') : t('common.cancel')}
                  </button>
                  {!alreadyRated && (
                    <button
                      type="submit"
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={loading || rating === 0}
                    >
                      {loading ? t('common.saving') : t('rating.modal.submit')}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

RatingModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  service: PropTypes.object,
  type: PropTypes.oneOf(['service', 'guide', 'tour']),
  loading: PropTypes.bool
};

export default RatingModal;