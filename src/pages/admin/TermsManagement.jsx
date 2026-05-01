import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  CheckCircleIcon,
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../../services/api';

const TERMS_TYPES = [
  { value: 'terms', icon: DocumentTextIcon }
];

const TermsManagement = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('terms');
  const [termsList, setTermsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);

  const [formData, setFormData] = useState({
    type: 'terms',
    version: '',
    title: '',
    content: '',
    effective_date: '',
    is_active: false
  });

  const [errors, setErrors] = useState({});

  // Ref para el editor contentEditable
  const editorRef = useRef(null);

  useEffect(() => {
    fetchTerms();
  }, []);

  // Sincronizar contenido del editor cuando cambia formData.content o se abre el modal
  useEffect(() => {
    if (showForm && editorRef.current) {
      // Solo actualizar si el contenido del editor es diferente al state
      if (editorRef.current.innerHTML !== formData.content) {
        editorRef.current.innerHTML = formData.content || '';
      }
    }
  }, [showForm, formData.content]);

  const fetchTerms = async () => {
    setLoading(true);
    try {
      const response = await api.get('/terms');
      if (response.data.success) {
        setTermsList(response.data.data || []);
      } else {
        toast.error(response.data.message || t('terms.loadError'));
      }
    } catch (error) {
      console.error('Error fetching terms:', error);
      toast.error(t('terms.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.version.trim()) {
      newErrors.version = t('terms.versionRequired');
    }

    if (!formData.title.trim()) {
      newErrors.title = t('terms.titleRequired');
    }

    if (!formData.content.trim()) {
      newErrors.content = t('terms.contentRequired');
    }

    if (!formData.effective_date) {
      newErrors.effective_date = t('terms.effectiveDateRequired');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      let response;
      if (editingTerm) {
        response = await api.put(`/terms/${editingTerm.id}`, formData);
      } else {
        response = await api.post('/terms', formData);
      }

      if (response.data.success) {
        toast.success(editingTerm ? t('terms.updated') : t('terms.created'));
        resetForm();
        fetchTerms();
      } else {
        toast.error(response.data.message || t('terms.saveError'));
      }
    } catch (error) {
      console.error('Error saving terms:', error);
      toast.error(t('terms.saveError'));
    }
  };

  const handleActivate = async (term) => {
    try {
      const response = await api.put(`/terms/${term.id}/activate`);

      if (response.data.success) {
        toast.success(`${t('terms.versionLabel')} ${term.version} ${t('terms.activated')}`);
        fetchTerms();
      } else {
        toast.error(response.data.message || t('terms.activateError'));
      }
    } catch (error) {
      console.error('Error activating terms:', error);
      toast.error(t('terms.activateError'));
    }
  };

  const handleEdit = (term) => {
    setEditingTerm(term);
    setFormData({
      type: term.type,
      version: term.version,
      title: term.title,
      content: term.content,
      effective_date: term.effective_date?.split('T')[0] || '',
      is_active: term.is_active
    });
    setShowForm(true);
  };

  const handlePreview = (term) => {
    setPreviewContent(term);
    setShowPreview(true);
  };

  const resetForm = () => {
    setFormData({
      type: activeTab,
      version: '',
      title: '',
      content: '',
      effective_date: '',
      is_active: false
    });
    setEditingTerm(null);
    setShowForm(false);
    setErrors({});
    // Limpiar el contenido del editor
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  };

  const filteredTerms = termsList.filter(term => term.type === activeTab);

  const getTypeConfig = (type) => TERMS_TYPES.find(t => t.value === type) || TERMS_TYPES[0];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <DocumentTextIcon className="w-8 h-8 text-blue-600" />
              {t('terms.managementTitle')}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('terms.managementSubtitle')}
            </p>
          </div>
          <button
            onClick={() => {
              setFormData(prev => ({ ...prev, type: activeTab }));
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            {t('terms.newVersion')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-4">
          {TERMS_TYPES.map((type) => {
            const Icon = type.icon;
            const isActive = activeTab === type.value;
            const activeCount = termsList.filter(t => t.type === type.value && t.is_active).length;

            return (
              <button
                key={type.value}
                onClick={() => setActiveTab(type.value)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5" />
                {t('terms.title')}
                {activeCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                    {t('terms.active')}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTerms.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <DocumentTextIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">{t('terms.noVersions', { type: t('terms.title') })}</p>
              <button
                onClick={() => {
                  setFormData(prev => ({ ...prev, type: activeTab }));
                  setShowForm(true);
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                {t('terms.createFirstVersion')}
              </button>
            </div>
          ) : (
            filteredTerms.map((term) => (
              <div
                key={term.id}
                className={`bg-white rounded-lg border p-6 ${
                  term.is_active ? 'border-green-300 bg-green-50/30' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{term.title}</h3>
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                        v{term.version}
                      </span>
                      {term.is_active && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full flex items-center gap-1">
                          <CheckCircleIcon className="w-3 h-3" />
                          {t('terms.active')}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      <p>{t('terms.effectiveSince')}: {new Date(term.effective_date).toLocaleDateString('es-PE')}</p>
                      <p>{t('terms.lastUpdate')}: {new Date(term.updated_at).toLocaleDateString('es-PE')}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePreview(term)}
                      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title={t('terms.preview')}
                    >
                      <EyeIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleEdit(term)}
                      className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title={t('terms.edit')}
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    {!term.is_active && (
                      <button
                        onClick={() => handleActivate(term)}
                        className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        {t('terms.activate')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={resetForm} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingTerm ? t('terms.editTitle') : t('terms.newVersion')}
                </h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
                {/* Versión */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('terms.versionLabel')} *
                  </label>
                  <input
                    type="text"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="Ej: 1.0, 2.0, 2.1"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.version ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={editingTerm}
                  />
                  {errors.version && <p className="mt-1 text-sm text-red-500">{errors.version}</p>}
                </div>

                {/* Título */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('terms.titleLabel')} *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={t('terms.titlePlaceholder')}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.title ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                </div>

                {/* Fecha de Vigencia */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('terms.effectiveDateLabel')} *
                  </label>
                  <input
                    type="date"
                    value={formData.effective_date}
                    onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.effective_date ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.effective_date && <p className="mt-1 text-sm text-red-500">{errors.effective_date}</p>}
                </div>

                {/* Contenido con editor simple */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('terms.contentLabel')} *
                  </label>
                  {/* Toolbar */}
                  <div className="flex flex-wrap gap-1 p-2 border border-b-0 border-gray-300 rounded-t-lg bg-gray-50">
                    <button
                      type="button"
                      onClick={() => document.execCommand('bold')}
                      className="px-3 py-1 text-sm font-bold hover:bg-gray-200 rounded"
                      title={t('terms.bold')}
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => document.execCommand('italic')}
                      className="px-3 py-1 text-sm italic hover:bg-gray-200 rounded"
                      title={t('terms.italic')}
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => document.execCommand('underline')}
                      className="px-3 py-1 text-sm underline hover:bg-gray-200 rounded"
                      title={t('terms.underline')}
                    >
                      U
                    </button>
                    <div className="w-px bg-gray-300 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => document.execCommand('formatBlock', false, 'h2')}
                      className="px-3 py-1 text-sm font-bold hover:bg-gray-200 rounded"
                      title={t('terms.heading')}
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onClick={() => document.execCommand('formatBlock', false, 'p')}
                      className="px-3 py-1 text-sm hover:bg-gray-200 rounded"
                      title={t('terms.paragraph')}
                    >
                      P
                    </button>
                    <div className="w-px bg-gray-300 mx-1"></div>
                    <button
                      type="button"
                      onClick={() => document.execCommand('insertUnorderedList')}
                      className="px-3 py-1 text-sm hover:bg-gray-200 rounded"
                      title={t('terms.list')}
                    >
                      {t('terms.bulletList')}
                    </button>
                    <button
                      type="button"
                      onClick={() => document.execCommand('insertOrderedList')}
                      className="px-3 py-1 text-sm hover:bg-gray-200 rounded"
                      title={t('terms.numberedList')}
                    >
                      {t('terms.orderedList')}
                    </button>
                  </div>
                  {/* Editor */}
                  <div
                    ref={editorRef}
                    contentEditable
                    dir="ltr"
                    onInput={(e) => setFormData({ ...formData, content: e.currentTarget.innerHTML })}
                    suppressContentEditableWarning={true}
                    className={`w-full min-h-[300px] px-3 py-2 border rounded-b-lg focus:ring-2 focus:ring-blue-500 focus:outline-none overflow-y-auto prose prose-sm max-w-none text-left ${
                      errors.content ? 'border-red-500' : 'border-gray-300'
                    }`}
                    style={{ maxHeight: '400px', direction: 'ltr', textAlign: 'left' }}
                    data-placeholder={t('terms.contentPlaceholder')}
                  />
                  {errors.content && <p className="mt-1 text-sm text-red-500">{errors.content}</p>}
                </div>

                {/* Activar al crear */}
                {!editingTerm && (
                  <div className="mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{t('terms.activateImmediately')}</span>
                    </label>
                  </div>
                )}
              </form>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t('terms.cancel')}
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingTerm ? t('terms.saveChanges') : t('terms.createVersion')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && previewContent && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setShowPreview(false)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{previewContent.title}</h2>
                  <p className="text-sm text-gray-500">{t('terms.versionLabel')} {previewContent.version}</p>
                </div>
                <button onClick={() => setShowPreview(false)} className="text-gray-400 hover:text-gray-600">
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: previewContent.content }}
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end p-6 border-t bg-gray-50">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t('terms.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TermsManagement;
