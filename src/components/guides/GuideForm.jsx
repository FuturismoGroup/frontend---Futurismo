import React from 'react';
import PropTypes from 'prop-types';
import useGuideForm from '../../hooks/useGuideForm';
import FormHeader from './FormHeader';
import FormTabs from './FormTabs';
import PersonalInfoTab from './PersonalInfoTab';
import LanguagesTab from './LanguagesTab';
import MuseumsTab from './MuseumsTab';
import FormFooter from './FormFooter';

const GuideForm = ({ guide, onSave, onCancel }) => {
  const {
    register,
    handleSubmit,
    errors,
    activeTab,
    setActiveTab,
    languageFields,
    appendLanguage,
    removeLanguage,
    museumFields,
    appendMuseum,
    removeMuseum,
    getAvailableLanguages,
    onSubmit,
    validationRules,
    languages,
    watch,
    setValue,
    isLoadingLanguages
  } = useGuideForm(guide, onSave);

  return (
    <div className="modal-overlay p-4">
      <div className="modal-content max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl">
        <FormHeader 
          isEditMode={!!guide} 
          onCancel={onCancel} 
        />

        <FormTabs 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
        />

        <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
          <form onSubmit={handleSubmit(onSubmit)} className="p-6">
            {activeTab === 'personal' && (
              <PersonalInfoTab
                register={register}
                errors={errors}
                validationRules={validationRules}
              />
            )}

            {activeTab === 'languages' && (
              <LanguagesTab
                register={register}
                languageFields={languageFields}
                appendLanguage={appendLanguage}
                removeLanguage={removeLanguage}
                getAvailableLanguages={getAvailableLanguages}
                languages={languages}
                isLoading={isLoadingLanguages}
              />
            )}

            {activeTab === 'museums' && (
              <MuseumsTab
                register={register}
                museumFields={museumFields}
                appendMuseum={appendMuseum}
                removeMuseum={removeMuseum}
                setValue={setValue}
                watch={watch}
              />
            )}
          </form>
        </div>

        <FormFooter 
          onCancel={onCancel} 
          onSubmit={handleSubmit(onSubmit)} 
        />
      </div>
    </div>
  );
};

GuideForm.propTypes = {
  guide: PropTypes.shape({
    id: PropTypes.string,
    fullName: PropTypes.string,
    dni: PropTypes.string,
    phone: PropTypes.string,
    email: PropTypes.string,
    address: PropTypes.string,
    guideType: PropTypes.string,
    specializations: PropTypes.shape({
      languages: PropTypes.array,
      museums: PropTypes.array
    })
  }),
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default GuideForm;