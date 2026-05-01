import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';
import chatService from '../../services/chatService';

const getRoleTabs = (t) => ({
  guides: { label: t('chat.roleTabs.guides'), active: 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' },
  agencies: { label: t('chat.roleTabs.agencies'), active: 'text-green-600 border-b-2 border-green-600 bg-green-50' },
  admins: { label: t('chat.roleTabs.administrators'), active: 'text-purple-600 border-b-2 border-purple-600 bg-purple-50' }
});

const NewChatModal = ({ isOpen, onClose, onSelectUser }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState({ guides: [], agencies: [], admins: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(null);

  const ROLE_TABS = getRoleTabs(t);

  useEffect(() => {
    const loadContacts = async () => {
      if (!isOpen) return;

      setLoading(true);
      try {
        const result = await chatService.getContacts();
        if (result.success) {
          setContacts(result.data);
          // Auto-seleccionar la primera pestaña con datos
          const firstTabWithData = Object.keys(ROLE_TABS).find(
            key => result.data[key]?.length > 0
          );
          setActiveTab(firstTabWithData || 'guides');
        }
      } catch (error) {
        console.error('Error loading contacts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContacts();
    setSearchTerm('');
  }, [isOpen]);

  // Tabs disponibles (solo los que tienen datos)
  const availableTabs = Object.entries(ROLE_TABS).filter(
    ([key]) => contacts[key]?.length > 0
  );

  // Contactos filtrados por búsqueda
  const filteredContacts = (contacts[activeTab] || []).filter(contact =>
    contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (contact.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectContact = (contact) => {
    onSelectUser(contact.id, contact.name);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('chat.newConversation', 'Nueva Conversación')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        {availableTabs.length > 1 && (
          <div className="flex border-b border-gray-200">
            {availableTabs.map(([key, config]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === key
                    ? config.active
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                {config.label}
                <span className="ml-1.5 text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5">
                  {contacts[key]?.length || 0}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('chat.searchContact', 'Buscar contacto...')}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Contact List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">
                {searchTerm ? t('chat.noContactsFound', 'No se encontraron contactos') : t('chat.noContactsAvailable', 'No hay contactos disponibles')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredContacts.map((contact) => {
                const avatar = contact.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contact.name)}&background=${
                  contact.role === 'guide' ? '3B82F6' : contact.role === 'agency' ? '10B981' : '8B5CF6'
                }&color=fff`;

                const roleLabel = contact.role === 'guide' ? t('chat.roleLabels.guide')
                  : contact.role === 'agency' ? t('chat.roleLabels.agency')
                  : t('chat.roleLabels.admin');

                return (
                  <button
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <img
                      src={avatar}
                      alt={contact.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">
                        {contact.name}
                      </h4>
                      <p className="text-sm text-gray-500 truncate">
                        {contact.email || roleLabel}
                      </p>
                    </div>
                    {availableTabs.length <= 1 && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        contact.role === 'guide' ? 'bg-blue-100 text-blue-700'
                        : contact.role === 'agency' ? 'bg-green-100 text-green-700'
                        : 'bg-purple-100 text-purple-700'
                      }`}>
                        {roleLabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t('common.cancel', 'Cancelar')}
          </button>
        </div>
      </div>
    </div>
  );
};

NewChatModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelectUser: PropTypes.func.isRequired
};

export default NewChatModal;
