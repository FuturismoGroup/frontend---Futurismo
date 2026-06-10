import React, { useState } from 'react';
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  XMarkIcon,
  PencilSquareIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

const STORAGE_KEY = 'agency_account_status';
const HISTORY_STORAGE_KEY = 'agency_account_status_history';

const INITIAL_DATA = {
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
};

const loadFromStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignorar errores de storage
  }
};

const AccountStatusSection = () => {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [accountData, setAccountData] = useState(() => loadFromStorage(STORAGE_KEY, INITIAL_DATA));
  const [editData, setEditData] = useState(null);
  const [history, setHistory] = useState(() => loadFromStorage(HISTORY_STORAGE_KEY, []));

  const complianceTitles = {
    businessLicense: t('profile.comp.businessLicense'),
    taxCertification: t('profile.comp.taxCertification'),
    insuranceCertificate: t('profile.comp.insuranceCertificate'),
    operatingPermit: t('profile.comp.operatingPermit')
  };

  const complianceStatusLabels = {
    approved: t('profile.comp.approved'),
    pending: t('profile.comp.statusPending'),
    rejected: t('profile.comp.rejected')
  };

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
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (isoString) => {
    return new Date(isoString).toLocaleString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleStartEdit = () => {
    setEditData(JSON.parse(JSON.stringify(accountData)));
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditData(null);
    setIsEditing(false);
  };

  const handleEditCompliance = (key, field, value) => {
    setEditData((prev) => ({
      ...prev,
      compliance: {
        ...prev.compliance,
        [key]: { ...prev.compliance[key], [field]: value }
      }
    }));
  };

  const handleSaveEdit = () => {
    if (!editData) return;

    const changes = [];
    Object.keys(editData.compliance).forEach((key) => {
      const oldItem = accountData.compliance[key];
      const newItem = editData.compliance[key];
      if (oldItem.status !== newItem.status) {
        changes.push({ item: key, field: 'status', oldValue: oldItem.status, newValue: newItem.status });
      }
      if (oldItem.date !== newItem.date) {
        changes.push({ item: key, field: 'date', oldValue: oldItem.date, newValue: newItem.date });
      }
    });

    if (changes.length === 0) {
      toast(t('profile.comp.noChangesDetected'));
      setIsEditing(false);
      setEditData(null);
      return;
    }

    const newHistoryEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      changes
    };
    const newHistory = [newHistoryEntry, ...history];
    const newData = {
      ...editData,
      lastActivity: new Date().toISOString().slice(0, 10)
    };

    setAccountData(newData);
    setHistory(newHistory);
    saveToStorage(STORAGE_KEY, newData);
    saveToStorage(HISTORY_STORAGE_KEY, newHistory);

    setEditData(null);
    setIsEditing(false);
    toast.success(t('profile.comp.documentsUpdated'));
  };

  const renderChangeValue = (change) => {
    if (change.field === 'status') {
      return `${complianceStatusLabels[change.oldValue] || change.oldValue} → ${complianceStatusLabels[change.newValue] || change.newValue}`;
    }
    return `${formatDate(change.oldValue)} → ${formatDate(change.newValue)}`;
  };

  const statusBadge = getStatusBadge(accountData.status);
  const verificationBadge = getVerificationBadge(accountData.verificationLevel);
  const currentData = isEditing ? editData : accountData;

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 lg:p-6">
        <div className="flex items-center justify-between gap-2 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <ShieldCheckIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{t('profile.comp.accountStatus')}</h3>
              <p className="text-xs sm:text-sm text-gray-500 truncate">{t('profile.comp.accountStatusSubtitle')}</p>
            </div>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
              title={isCollapsed ? t('common.expand') : t('common.collapse')}
              aria-label={isCollapsed ? t('common.expand') : t('common.collapse')}
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
                      {React.createElement(statusBadge.icon, { className: 'w-5 h-5' })}
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
                      {React.createElement(verificationBadge.icon, { className: 'w-5 h-5' })}
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
                  {Object.entries(currentData.compliance).map(([key, item]) => {
                    const badge = getComplianceBadge(item.status);

                    return (
                      <div key={key} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2 gap-2">
                          <h5 className="text-sm font-medium text-gray-900">{complianceTitles[key]}</h5>
                          {isEditing ? (
                            <select
                              value={item.status}
                              onChange={(e) => handleEditCompliance(key, 'status', e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="approved">{complianceStatusLabels.approved}</option>
                              <option value="pending">{complianceStatusLabels.pending}</option>
                              <option value="rejected">{complianceStatusLabels.rejected}</option>
                            </select>
                          ) : (
                            <div className="flex items-center gap-1">
                              {React.createElement(badge.icon, { className: 'w-4 h-4' })}
                              <span className={`px-2 py-1 rounded text-xs font-medium ${badge.color}`}>
                                {badge.text}
                              </span>
                            </div>
                          )}
                        </div>
                        {isEditing ? (
                          <input
                            type="date"
                            value={item.date}
                            onChange={(e) => handleEditCompliance(key, 'date', e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        ) : (
                          <p className="text-xs text-gray-500">
                            {item.status === 'approved' ? t('profile.comp.approvedOn') : t('profile.comp.submittedOn')}: {formatDate(item.date)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Acciones disponibles */}
              <div className="border-t border-gray-200 pt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-4">{t('profile.comp.availableActions')}</h4>
                <div className="flex flex-wrap gap-3">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <CheckIcon className="w-4 h-4" />
                        {t('common.save')}
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4" />
                        {t('common.cancel')}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleStartEdit}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <PencilSquareIcon className="w-4 h-4" />
                        {t('profile.comp.updateDocuments')}
                      </button>
                      <button
                        onClick={() => setIsHistoryOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <ClockIcon className="w-4 h-4" />
                        {t('profile.comp.changeHistory')}
                      </button>
                    </>
                  )}
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

      {/* Modal de historial de cambios */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsHistoryOpen(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {t('profile.comp.changeHistory')}
              </h3>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {history.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ClockIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>{t('profile.comp.noHistoryYet')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {history.map((entry) => (
                    <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                        <CalendarIcon className="w-4 h-4" />
                        {formatDateTime(entry.timestamp)}
                      </div>
                      <ul className="space-y-2">
                        {entry.changes.map((change, index) => (
                          <li key={index} className="text-sm text-gray-700">
                            <span className="font-medium text-gray-900">
                              {complianceTitles[change.item]}
                            </span>
                            <span className="text-gray-500 mx-1">·</span>
                            <span className="text-gray-500">
                              {change.field === 'status'
                                ? t('profile.comp.statusLabel')
                                : t('profile.comp.dateLabel')}:
                            </span>{' '}
                            <span>{renderChangeValue(change)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AccountStatusSection;
