import React, { useState, useEffect } from 'react';
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, StarIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

const FeedbackSectionSimple = ({ userRole = 'agency' }) => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState('');
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuthStore();
  
  // Solo las agencias pueden agregar comentarios
  const canAddFeedback = userRole === 'agency';
  // Los admins pueden ver todo, las agencias ven solo lo suyo
  const canViewFeedback = userRole === 'agency' || userRole === 'admin';

  // Cargar historial de feedback del usuario
  const fetchFeedbackHistory = async () => {
    if (!canViewFeedback) return;

    try {
      setLoading(true);
      // Admin ve todos, agency/guide/tourist ven solo los suyos
      const endpoint = userRole === 'admin' ? '/feedback' : '/feedback/my';
      const response = await api.get(endpoint);

      if (response.data?.success) {
        setFeedbackHistory(response.data.data || []);
      }
    } catch (error) {
      console.error('Error al cargar historial de feedback:', error);
      // No mostrar toast de error para no molestar al usuario
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbackHistory();
  }, [userRole]);

  const handleSubmit = async () => {
    if (!canAddFeedback) {
      toast.error(t('profile.comp.onlyAgenciesCanSend'));
      return;
    }
    if (!message.trim()) {
      toast.error(t('profile.comp.writeComment'));
      return;
    }
    if (rating === 0) {
      toast.error(t('profile.comp.selectRating'));
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post('/feedback', {
        feedbackType: 'general',
        subject: `Feedback de ${user?.name || 'Agencia'}`,
        message: message.trim(),
        rating: rating,
        priority: 'normal'
      });

      if (response.data?.success) {
        toast.success(t('profile.comp.feedbackThanks'));
        setMessage('');
        setRating(0);
        // Recargar historial para mostrar el nuevo feedback
        fetchFeedbackHistory();
      }
    } catch (error) {
      console.error('Error al enviar feedback:', error);
      toast.error(error.response?.data?.message || t('errors.unexpectedError'));
    } finally {
      setSubmitting(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Configuración de textos según el rol
  const getTexts = () => {
    if (userRole === 'admin') {
      return {
        title: t('profile.comp.agencyFeedback'),
        subtitle: t('profile.comp.agencyFeedbackSubtitle'),
        formTitle: t('profile.comp.adminView')
      };
    }
    return {
      title: t('profile.comp.opinionsAndSuggestions'),
      subtitle: t('profile.comp.helpUsImprove'),
      formTitle: t('profile.comp.shareYourOpinion')
    };
  };

  const texts = getTexts();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-pink-100 rounded-lg">
            <ChatBubbleLeftRightIcon className="w-5 h-5 text-pink-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{texts.title}</h3>
            <p className="text-sm text-gray-500">{texts.subtitle}</p>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title={isCollapsed ? t('common.expand') : t('common.collapse')}
          >
            {isCollapsed ? (
              <ChevronDownIcon className="w-5 h-5" />
            ) : (
              <ChevronUpIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div>
          {/* Formulario simple - Solo para agencias */}
          {canAddFeedback && (
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-200 rounded-lg p-6 mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-4">
                💡 {texts.formTitle}
              </h4>
            
            <div className="space-y-4">
              {/* Calificación */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.comp.generalRating')} *
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-colors"
                    >
                      <StarIcon className={`w-6 h-6 ${star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300 hover:text-yellow-400'}`} />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {rating > 0 && `${rating}/5`}
                  </span>
                </div>
              </div>

              {/* Mensaje */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('profile.comp.yourComment')} *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('profile.comp.feedbackPlaceholder')}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>

              {/* Botón de envío */}
              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={!message.trim() || rating === 0 || submitting}
                  className="flex items-center gap-2 px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t('profile.comp.sending')}
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-4 h-4" />
                      {t('profile.comp.sendFeedback')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
          )}

          {/* Vista para administradores */}
          {userRole === 'admin' && !canAddFeedback && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h4 className="text-md font-semibold text-gray-900 mb-2">
                👁️ Vista de administrador
              </h4>
              <p className="text-sm text-gray-600">
                {t('profile.comp.adminFeedbackNote')}
              </p>
            </div>
          )}

          {/* Historial de feedback desde API */}
          {canViewFeedback && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-4">
                {userRole === 'admin' ? t('profile.comp.allComments') : t('profile.comp.yourPreviousFeedback')}
              </h4>

              {loading ? (
                <div className="flex justify-center py-8">
                  <svg className="animate-spin h-6 w-6 text-pink-600" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : feedbackHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>{t('profile.comp.noFeedbackYet')}</p>
                  {canAddFeedback && <p className="text-sm mt-1">{t('profile.comp.beFirstToShare')}</p>}
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbackHistory.map((feedback) => (
                    <div key={feedback.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{feedback.subject}</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            star <= (feedback.rating || 0) ? (
                              <StarIconSolid key={star} className="w-3 h-3 text-yellow-400" />
                            ) : (
                              <StarIcon key={star} className="w-3 h-3 text-gray-300" />
                            )
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{feedback.message}</p>
                      <div className="text-sm text-gray-500">
                        {formatDate(feedback.createdAt)}
                        {userRole === 'admin' && feedback.user && ` • ${feedback.user.name || feedback.user.email}`}
                      </div>
                      {feedback.response && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                          <strong>{t('profile.comp.response')}:</strong> {feedback.response}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Información */}
          {canViewFeedback && (
            <div className="mt-6 p-4 bg-pink-50 border border-pink-200 rounded-lg">
              <p className="text-sm text-pink-800">
                <span className="font-medium">
                  {userRole === 'admin' ? t('profile.comp.infoLabel') + ':' : t('profile.comp.yourOpinionMatters') + ':'}
                </span>{' '}
                {userRole === 'admin'
                  ? t('profile.comp.adminFeedbackInfoNote')
                  : t('profile.comp.feedbackInfoNote')
                }
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FeedbackSectionSimple;