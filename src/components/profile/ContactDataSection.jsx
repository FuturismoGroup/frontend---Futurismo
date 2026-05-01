import { useState, useEffect } from 'react';
import { PhoneIcon, PencilIcon, CheckIcon, XMarkIcon, PlusIcon, TrashIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { useAgencyStore } from '../../stores/agencyStore';
import toast from 'react-hot-toast';

const ContactDataSection = () => {
  const { t } = useTranslation();
  const currentAgency = useAgencyStore((state) => state.currentAgency);
  const actions = useAgencyStore((state) => state.actions);
  const storeLoading = useAgencyStore((state) => state.isLoading);
  const [isEditing, setIsEditing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [contacts, setContacts] = useState([]);

  // Cargar contactos de la agencia
  useEffect(() => {
    if (currentAgency?.contacts) {
      setContacts(currentAgency.contacts);
    }
  }, [currentAgency]);

  const [newContact, setNewContact] = useState({
    name: '',
    position: '',
    phone: '',
    email: '',
    department: ''
  });

  const handleAddContact = () => {
    if (newContact.name && newContact.phone && newContact.email) {
      const contact = {
        id: Date.now(),
        ...newContact
      };
      setContacts([...contacts, contact]);
      setNewContact({
        name: '',
        position: '',
        phone: '',
        email: '',
        department: ''
      });
    }
  };

  const handleDeleteContact = (id) => {
    setContacts(contacts.filter(contact => contact.id !== id));
  };

  const handleSave = async () => {
    if (!currentAgency) {
      toast.error(t('profile.comp.agencyNotFound'));
      return;
    }

    setIsLocalLoading(true);

    try {
      const updateData = {
        contacts: contacts
      };

      console.log('💾 Guardando contactos:', updateData);

      await actions.updateAgencyProfile(updateData);

      toast.success(t('common.update'));
      setIsEditing(false);
    } catch (error) {
      console.error('❌ Error al guardar:', error);
      toast.error(error.message || t('errors.unexpectedError'));
    } finally {
      setIsLocalLoading(false);
    }
  };

  const handleCancel = () => {
    // Restaurar contactos originales
    if (currentAgency?.contacts) {
      setContacts(currentAgency.contacts);
    } else {
      setContacts([]);
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 bg-green-100 rounded-lg">
            <PhoneIcon className="w-5 h-5 text-green-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{t('profile.comp.contactData')}</h3>
            <p className="text-sm text-gray-500">{t('profile.comp.contactDataSubtitle')}</p>
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
        
        {!isCollapsed && (
          !isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <PencilIcon className="w-4 h-4" />
              {t('common.edit')}
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={isLocalLoading || storeLoading}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLocalLoading || storeLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {t('common.saving')}
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-4 h-4" />
                    {t('common.save')}
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isLocalLoading || storeLoading}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XMarkIcon className="w-4 h-4" />
                {t('common.cancel')}
              </button>
            </div>
          )
        )}
      </div>

      {!isCollapsed && (
        <div>
          {/* Lista de contactos */}
          <div className="space-y-4">
            {contacts.map((contact) => (
              <div key={contact.id} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('profile.comp.fullName')} *
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={contact.name}
                        onChange={(e) => {
                          const updatedContacts = contacts.map(c => 
                            c.id === contact.id ? { ...c, name: e.target.value } : c
                          );
                          setContacts(updatedContacts);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{contact.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('profile.comp.position')}
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={contact.position}
                        onChange={(e) => {
                          const updatedContacts = contacts.map(c => 
                            c.id === contact.id ? { ...c, position: e.target.value } : c
                          );
                          setContacts(updatedContacts);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{contact.position}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('profile.comp.department')}
                    </label>
                    {isEditing ? (
                      <select
                        value={contact.department}
                        onChange={(e) => {
                          const updatedContacts = contacts.map(c => 
                            c.id === contact.id ? { ...c, department: e.target.value } : c
                          );
                          setContacts(updatedContacts);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">{t('common.select')}</option>
                        <option value="Administración">{t('profile.comp.deptAdmin')}</option>
                        <option value="Operaciones">{t('profile.comp.deptOperations')}</option>
                        <option value="Ventas">{t('profile.comp.deptSales')}</option>
                        <option value="Marketing">{t('profile.comp.deptMarketing')}</option>
                        <option value="Recursos Humanos">{t('profile.comp.deptHR')}</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">{contact.department}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {t('profile.comp.phone')} *
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        placeholder="9XXXXXXXX"
                        maxLength="9"
                        pattern="9[0-9]{8}"
                        value={contact.phone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/[^0-9]/g, '');
                          if (value === '' || (value[0] === '9' && value.length <= 9)) {
                            const updatedContacts = contacts.map(c => 
                              c.id === contact.id ? { ...c, phone: value } : c
                            );
                            setContacts(updatedContacts);
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900">{contact.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={contact.email}
                        onChange={(e) => {
                          const updatedContacts = contacts.map(c => 
                            c.id === contact.id ? { ...c, email: e.target.value } : c
                          );
                          setContacts(updatedContacts);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                        {contact.email}
                      </a>
                    )}
                  </div>

                  {isEditing && (
                    <div className="flex items-end">
                      <button
                        onClick={() => handleDeleteContact(contact.id)}
                        className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <TrashIcon className="w-4 h-4" />
                        {t('common.delete')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Formulario para agregar nuevo contacto */}
            {isEditing && (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">{t('profile.comp.addNewContact')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <input
                      type="text"
                      placeholder={`${t('profile.comp.fullName')} *`}
                      value={newContact.name}
                      onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder={t('profile.comp.position')}
                      value={newContact.position}
                      onChange={(e) => setNewContact({ ...newContact, position: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <select
                      value={newContact.department}
                      onChange={(e) => setNewContact({ ...newContact, department: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">{t('profile.comp.department')}</option>
                      <option value="Administración">{t('profile.comp.deptAdmin')}</option>
                      <option value="Operaciones">{t('profile.comp.deptOperations')}</option>
                      <option value="Ventas">{t('profile.comp.deptSales')}</option>
                      <option value="Marketing">{t('profile.comp.deptMarketing')}</option>
                      <option value="Recursos Humanos">{t('profile.comp.deptHR')}</option>
                    </select>
                  </div>
                  <div>
                    <input
                      type="tel"
                      placeholder="9XXXXXXXX (9 dígitos)"
                      maxLength="9"
                      pattern="9[0-9]{8}"
                      value={newContact.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        if (value === '' || (value[0] === '9' && value.length <= 9)) {
                          setNewContact({ ...newContact, phone: value });
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <input
                      type="email"
                      placeholder="Email *"
                      value={newContact.email}
                      onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={handleAddContact}
                      disabled={!newContact.name || !newContact.phone || !newContact.email}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PlusIcon className="w-4 h-4" />
                      {t('common.add')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Nota informativa */}
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              <span className="font-medium">{t('profile.comp.tipLabel')}:</span> {t('profile.comp.contactInfoNote')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactDataSection;