import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';
import { reviewSchema } from '../../utils/validationSchemas/marketplaceSchemas';
import useMarketplaceStore from '../../stores/marketplaceStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';
import { formatDateSafe } from '../../utils/dateUtils';
import { resolveFileUrl } from '../../utils/fileUrl';

const ServiceReview = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { serviceRequests, createReview } = useMarketplaceStore();

  const [request, setRequest] = useState(null);
  const [guide, setGuide] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: ''
    }
  });

  const watchRating = watch('rating');

  useEffect(() => {
    loadRequestData();
  }, [requestId]);

  const loadRequestData = async () => {
    setIsLoading(true);
    try {
      const foundRequest = serviceRequests.find(r => r.id === requestId);
      if (foundRequest && foundRequest.status === 'completed') {
        setRequest(foundRequest);
        setGuide(foundRequest.guide || null);
      } else {
        navigate('/marketplace/requests');
      }
    } catch (error) {
      console.error('Error loading request:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await createReview({
        serviceRequestId: requestId,
        guideId: guide.id,
        rating: data.rating,
        comment: data.comment
      });

      toast.success(t('marketplace.messages.reviewSuccess'));
      navigate(`/marketplace/requests/${requestId}`);
    } catch (error) {
      console.error('Error creating review:', error);
      toast.error(t('marketplace.messages.reviewError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!request || !guide) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('marketplace.review.title')}</h1>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <img
                src={resolveFileUrl(guide.profilePhoto) || '/images/default-avatar.png'}
                alt={guide.name || t('marketplace.review.fallbackGuide')}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{guide.name || t('marketplace.review.fallbackGuide')}</p>
                <p className="text-sm text-gray-600">
                  {request.location || t('marketplace.review.freelanceService')} •
                  {' '}{formatDateSafe(request.serviceDate) || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Calificacion */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('marketplace.review.rating')}</h2>

            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setValue('rating', star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="p-1 transition-colors hover:bg-gray-50 rounded"
                >
                  {star <= (hoveredRating || watchRating) ? (
                    <StarSolidIcon className="h-8 w-8 text-yellow-400" />
                  ) : (
                    <StarIcon className="h-8 w-8 text-gray-300" />
                  )}
                </button>
              ))}
              {watchRating > 0 && (
                <span className="ml-2 text-sm text-gray-600 font-medium">
                  {watchRating}/5
                </span>
              )}
            </div>
            {errors.rating && (
              <p className="mt-2 text-sm text-red-600">{errors.rating.message}</p>
            )}
          </div>

          {/* Comentario */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('marketplace.review.comment')}</h2>

            <textarea
              {...register('comment')}
              rows={4}
              placeholder={t('marketplace.review.commentPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-cyan-500 focus:border-cyan-500"
            />
            {errors.comment && (
              <p className="mt-1 text-sm text-red-600">{errors.comment.message}</p>
            )}
          </div>

          {/* Resumen visual */}
          {watchRating > 0 && (
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <StarSolidIcon
                      key={i}
                      className={`h-6 w-6 ${
                        i < watchRating ? 'text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-cyan-900">
                  {t('marketplace.review.yourRating')} <span className="font-semibold">{watchRating}/5</span>
                </p>
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate(`/marketplace/requests/${requestId}`)}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('marketplace.review.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  {t('marketplace.review.sending')}
                </span>
              ) : (
                t('marketplace.review.submit')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceReview;
