/**
 * LanguagesSettings - Gestión de idiomas del sistema
 * Permite agregar, editar, activar/desactivar y eliminar idiomas
 * Solo accesible para administradores
 */

import React, { useState, useEffect } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  CheckIcon,
  GlobeAltIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import languageService from '../../services/languageService';

const LanguagesSettings = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [languages, setLanguages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState(null);
  const [formData, setFormData] = useState({ code: '', name: '', nativeName: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Cargar idiomas al abrir
  useEffect(() => {
    if (isOpen) {
      loadLanguages();
    }
  }, [isOpen]);

  const loadLanguages = async () => {
    setIsLoading(true);
    try {
      const result = await languageService.getAllLanguages();
      if (result.success) {
        setLanguages(result.data);
      } else {
        toast.error(t('errors.unexpectedError'));
      }
    } catch (error) {
      toast.error(t('errors.unexpectedError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.code || !formData.name) {
      toast.error(t('validation.codeRequired'));
      return;
    }

    if (formData.code.length !== 2) {
      toast.error(t('validation.codeMustBe2Chars'));
      return;
    }

    setIsSaving(true);
    try {
      let result;
      if (editingLanguage) {
        result = await languageService.updateLanguage(editingLanguage.id, formData);
      } else {
        result = await languageService.createLanguage(formData);
      }

      if (result.success) {
        toast.success(editingLanguage ? t('common.update') : t('common.create'));
        await loadLanguages();
        resetForm();
      } else {
        toast.error(result.error || t('errors.unexpectedError'));
      }
    } catch (error) {
      toast.error(t('errors.unexpectedError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (language) => {
    try {
      const result = await languageService.toggleLanguageStatus(language.id);
      if (result.success) {
        toast.success(result.data.isActive ? t('providers.status.active') : t('providers.status.inactive'));
        await loadLanguages();
      } else {
        toast.error(result.error || t('errors.unexpectedError'));
      }
    } catch (error) {
      toast.error(t('errors.unexpectedError'));
    }
  };

  const handleDelete = async (language) => {
    try {
      const result = await languageService.deleteLanguage(language.id);
      if (result.success) {
        toast.success(t('common.delete'));
        await loadLanguages();
        setDeleteConfirm(null);
      } else {
        toast.error(result.error || t('errors.unexpectedError'));
      }
    } catch (error) {
      toast.error(t('errors.unexpectedError'));
    }
  };

  const handleEdit = (language) => {
    setEditingLanguage(language);
    setFormData({
      code: language.code,
      name: language.name,
      nativeName: language.nativeName || ''
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingLanguage(null);
    setFormData({ code: '', name: '', nativeName: '' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <GlobeAltIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{t('pdf.languages')}</h2>
              <p className="text-sm text-gray-500">{t('settings.general.systemLanguage')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Botón agregar */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mb-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              <span>{t('common.add')}</span>
            </button>
          )}

          {/* Formulario */}
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                {editingLanguage ? t('common.edit') : t('common.create')}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t('search.code')} ISO *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })}
                    placeholder="es"
                    maxLength={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm uppercase"
                    disabled={editingLanguage !== null}
                  />
                  <p className="text-xs text-gray-400 mt-1">2 letras (ISO 639-1)</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t('pdf.name')} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Español"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t('pdf.name')}
                  </label>
                  <input
                    type="text"
                    value={formData.nativeName}
                    onChange={(e) => setFormData({ ...formData, nativeName: e.target.value })}
                    placeholder="Español"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{t('common.saving')}</span>
                    </>
                  ) : (
                    <>
                      <CheckIcon className="w-4 h-4" />
                      <span>{editingLanguage ? t('common.update') : t('common.create')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Lista de idiomas */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">{t('common.loading')}</span>
            </div>
          ) : languages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <GlobeAltIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>{t('common.noData')}</p>
              <p className="text-sm">{t('common.add')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {languages.map((language) => (
                <div
                  key={language.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    language.isActive
                      ? 'bg-white border-gray-200'
                      : 'bg-gray-50 border-gray-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600 uppercase">
                        {language.code}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{language.name}</div>
                      {language.nativeName && language.nativeName !== language.name && (
                        <div className="text-sm text-gray-500">{language.nativeName}</div>
                      )}
                    </div>
                    {!language.isActive && (
                      <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded">
                        {t('providers.status.inactive')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Toggle activo/inactivo */}
                    <button
                      onClick={() => handleToggleStatus(language)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        language.isActive ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                      title={language.isActive ? t('users.list.deactivate') : t('users.list.activate')}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          language.isActive ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>

                    {/* Editar */}
                    <button
                      onClick={() => handleEdit(language)}
                      className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title={t('common.edit')}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>

                    {/* Eliminar */}
                    {deleteConfirm === language.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(language)}
                          className="p-2 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                          title={t('common.confirm')}
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                          title={t('common.cancel')}
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(language.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title={t('common.delete')}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-start gap-2 text-xs text-gray-500">
            <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <p>
              {t('settings.general.systemLanguage')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LanguagesSettings;
