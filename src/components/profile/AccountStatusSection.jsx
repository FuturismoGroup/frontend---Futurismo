import React, { useState } from 'react';
import { ShieldCheckIcon, CheckCircleIcon, ExclamationTriangleIcon, ClockIcon, CalendarIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const AccountStatusSection = () => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [accountData] = useState({
    status: 'active',
    verificationLevel: 'verified',
    memberSince: '2014-03-15',
    lastActivity: '2024-06-26',
    compliance: {
      businessLicense: { status: 'approved', date: '2024-01-15' },
      taxCertification: { status: 'approved', date: '2024-02-20' },
      insuranceCertificate: { status: 'approved', date: '2024-03-10' },
      operatingPermit: { status: 'pending', date: '2024-06-20' }
    }
  });

  const getStatusBadge = (status) => {
    const badges = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: t('profile.comp.statusActive') },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, text: t('profile.comp.statusPending') },
      suspended: { color: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon, text: t('profile.comp.statusSuspended') }
    };
    return badges[status] || badges.pending;
  };

  const getVerificationBadge = (level) => {
    const badges = {
      verified: { color: 'bg-blue-100 text-blue-800', icon: CheckCircleIcon, text: t('profile.comp.verified') },
      partial: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, text: t('profile.comp.partialVerification') },
      unverified: { color: 'bg-gray-100 text-gray-800', icon: ExclamationTriangleIcon, text: t('profile.comp.notVerified') }
    };
    return badges[level] || badges.unverified;
  };

  const getComplianceBadge = (status) => {
    const badges = {
      approved: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon, text: t('profile.comp.approved') },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon, text: t('profile.comp.statusPending') },
      rejected: { color: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon, text: t('profile.comp.rejected') }
    };
    return badges[status] || badges.pending;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const statusBadge = getStatusBadge(accountData.status);
  const verificationBadge = getVerificationBadge(accountData.verificationLevel);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{t('profile.comp.accountStatus')}</h3>
            <p className="text-sm text-gray-500">{t('profile.comp.accountStatusSubtitle')}</p>
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
          <div className="space-y-6">
        {/* Estado general */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('profile.comp.accountStatus')}
              </label>
              <div className="flex items-center gap-2">
                {React.createElement(statusBadge.icon, { className: "w-5 h-5" })}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusBadge.color}`}>
                  {statusBadge.text}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('profile.comp.verificationLevel')}
              </label>
              <div className="flex items-center gap-2">
                {React.createElement(verificationBadge.icon, { className: "w-5 h-5" })}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${verificationBadge.color}`}>
                  {verificationBadge.text}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('profile.comp.memberSince')}
              </label>
              <div className="flex items-center gap-2 text-gray-900">
                <CalendarIcon className="w-4 h-4" />
                {formatDate(accountData.memberSince)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('profile.comp.lastActivity')}
              </label>
              <div className="flex items-center gap-2 text-gray-900">
                <ClockIcon className="w-4 h-4" />
                {formatDate(accountData.lastActivity)}
              </div>
            </div>
          </div>
        </div>

        {/* Estado de cumplimiento normativo */}
        <div>
          <h4 className="text-md font-semibold text-gray-900 mb-4">{t('profile.comp.regulatoryCompliance')}</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(accountData.compliance).map(([key, item]) => {
              const badge = getComplianceBadge(item.status);
              const titles = {
                businessLicense: t('profile.comp.businessLicense'),
                taxCertification: t('profile.comp.taxCertification'),
                insuranceCertificate: t('profile.comp.insuranceCertificate'),
                operatingPermit: t('profile.comp.operatingPermit')
              };
              
              return (
                <div key={key} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="text-sm font-medium text-gray-900">{titles[key]}</h5>
                    <div className="flex items-center gap-1">
                      {React.createElement(badge.icon, { className: "w-4 h-4" })}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
                        {badge.text}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {item.status === 'approved' ? t('profile.comp.approvedOn') : t('profile.comp.submittedOn')}: {formatDate(item.date)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Acciones disponibles */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">{t('profile.comp.availableActions')}</h4>
          <div className="flex flex-wrap gap-3">
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              {t('profile.comp.updateDocuments')}
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              {t('profile.comp.requestVerification')}
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              {t('profile.comp.changeHistory')}
            </button>
          </div>
        </div>
          </div>

          {/* Nota informativa */}
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">{t('profile.comp.infoLabel')}:</span> {t('profile.comp.accountInfoNote')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountStatusSection;