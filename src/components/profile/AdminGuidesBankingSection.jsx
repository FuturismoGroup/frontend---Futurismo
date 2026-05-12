import { useState, useEffect } from 'react';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CreditCardIcon,
  MagnifyingGlassIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { resolveFileUrl } from '../../utils/fileUrl';

const AdminGuidesBankingSection = () => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [guides, setGuides] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuide, setSelectedGuide] = useState(null);

  // Cargar guías
  useEffect(() => {
    loadGuides();
  }, []);

  const loadGuides = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/guides');
      console.log('📦 Guías cargados (admin):', response.data);

      if (response.data.success && response.data.data) {
        setGuides(response.data.data.guides || []);
      }
    } catch (error) {
      console.error('❌ Error al cargar guías:', error);
      toast.error(t('errors.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar guías por búsqueda
  const filteredGuides = guides.filter(guide => {
    const searchLower = searchTerm.toLowerCase();
    return (
      guide.first_name?.toLowerCase().includes(searchLower) ||
      guide.last_name?.toLowerCase().includes(searchLower) ||
      guide.email?.toLowerCase().includes(searchLower) ||
      guide.id?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CreditCardIcon className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">
              {t('profile.comp.guidesBankingData')}
            </h3>
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            {isCollapsed ? (
              <ChevronDownIcon className="h-5 w-5" />
            ) : (
              <ChevronUpIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-6">
          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>{t('profile.comp.confidentialInfo')}:</strong> {t('profile.comp.bankingConfidentialNote')}
            </p>
          </div>

          {/* Buscador */}
          <div className="mb-6">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder={t('profile.comp.searchGuidePlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Loading */}
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="ml-2 text-gray-600">{t('profile.comp.loadingGuides')}</span>
            </div>
          ) : filteredGuides.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? t('profile.comp.noGuidesFound') : t('profile.comp.noGuidesRegistered')}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Lista de guías */}
              <div className="grid grid-cols-1 gap-4">
                {filteredGuides.map((guide) => (
                  <div
                    key={guide.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedGuide?.id === guide.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedGuide(selectedGuide?.id === guide.id ? null : guide)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {guide.avatar ? (
                            <img
                              src={resolveFileUrl(guide.avatar)}
                              alt={`${guide.first_name} ${guide.last_name}`}
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            {guide.first_name} {guide.last_name}
                          </h4>
                          <p className="text-sm text-gray-500">{guide.email}</p>
                          <p className="text-xs text-gray-400">ID: {guide.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          guide.type === 'planta'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {guide.type === 'planta' ? t('profile.comp.employed') : t('profile.comp.freelance')}
                        </span>
                      </div>
                    </div>

                    {/* Datos bancarios (expandido) */}
                    {selectedGuide?.id === guide.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        {guide.banking ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-medium text-gray-500">{t('profile.comp.bank')}</p>
                              <p className="text-sm text-gray-900">{guide.banking.bank_name || t('profile.comp.notSpecified')}</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">{t('profile.comp.accountType')}</p>
                              <p className="text-sm text-gray-900">
                                {guide.banking.account_type ? `${t('profile.comp.accountOf')} ${guide.banking.account_type}` : t('profile.comp.notSpecified')}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">{t('profile.comp.accountNumber')}</p>
                              <p className="text-sm text-gray-900 font-mono">
                                {guide.banking.account_number || t('profile.comp.notSpecified')}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">{t('profile.comp.cciLabel')}</p>
                              <p className="text-sm text-gray-900 font-mono">
                                {guide.banking.interbank_code || t('profile.comp.notSpecified')}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">{t('profile.comp.holder')}</p>
                              <p className="text-sm text-gray-900">
                                {guide.banking.account_holder || t('profile.comp.notSpecified')}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">{t('profile.comp.holderDNI')}</p>
                              <p className="text-sm text-gray-900">
                                {guide.banking.identification_number || guide.documents?.dni || t('profile.comp.notSpecified')}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-medium text-gray-500">{t('profile.comp.currency')}</p>
                              <p className="text-sm text-gray-900">
                                {guide.banking.currency === 'PEN' ? t('profile.comp.soles') : guide.banking.currency || t('profile.comp.notSpecified')}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-sm text-gray-500">
                              {t('profile.comp.noBankingData')}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Resumen */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{filteredGuides.length}</p>
                    <p className="text-xs text-gray-500">{t('profile.comp.totalGuides')}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-blue-600">
                      {filteredGuides.filter(g => g.banking).length}
                    </p>
                    <p className="text-xs text-gray-500">{t('profile.comp.withBankingData')}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {filteredGuides.filter(g => !g.banking).length}
                    </p>
                    <p className="text-xs text-gray-500">{t('profile.comp.withoutBankingData')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminGuidesBankingSection;
