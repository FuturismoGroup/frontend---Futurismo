import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import useGuidesStore from '../stores/guidesStore';
import { DNI_REGEX, EMAIL_REGEX, PHONE_REGEX } from '../constants/guidesConstants';
import { AVAILABLE_LANGUAGES } from '../config/languages';

const useGuideForm = (guide, onSave) => {
  const { commonMuseums = [] } = useGuidesStore();
  const [activeTab, setActiveTab] = useState('personal');
  const isLoadingLanguages = false;

  const languages = AVAILABLE_LANGUAGES;
  const museums = commonMuseums;

  // Transformar datos del guía del formato backend al formato del formulario
  const transformGuideData = (guide) => {
    if (!guide) return null;

    // Obtener fullName de diferentes fuentes posibles
    const fullName = guide.fullName ||
                     guide.name ||
                     (guide.first_name && guide.last_name
                       ? `${guide.first_name} ${guide.last_name}`.trim()
                       : '');

    // Obtener DNI de diferentes fuentes
    const dni = guide.dni || guide.documents?.dni || '';

    // Obtener guideType (puede venir como guideType o guide_type)
    const guideType = guide.guideType || guide.guide_type || 'FREELANCE';

    // Transformar languages: puede ser array de strings o array de objetos
    let formLanguages = [{ code: '', level: 'principiante' }];
    const rawLanguagesSource = guide.specializations?.languages || guide.languages || [];
    const rawLanguages = Array.isArray(rawLanguagesSource) ? rawLanguagesSource : [];

    if (rawLanguages.length > 0) {
      formLanguages = rawLanguages.map(lang => {
        // Si ya es objeto con code y level
        if (typeof lang === 'object' && lang.code) {
          return { code: lang.code, level: lang.level || 'principiante' };
        }
        // Si es string (solo código de idioma)
        if (typeof lang === 'string') {
          return { code: lang, level: 'principiante' };
        }
        return { code: '', level: 'principiante' };
      });
    }

    // Transformar museums: puede venir en specializations o directamente
    let formMuseums = [{ name: '', expertise: 'basico', years: 1, certificates: [] }];
    const rawMuseumsSource = guide.specializations?.museums || guide.museums || [];
    const rawMuseums = Array.isArray(rawMuseumsSource) ? rawMuseumsSource : [];

    if (rawMuseums.length > 0) {
      formMuseums = rawMuseums.map(museum => {
        if (typeof museum === 'object') {
          return {
            name: museum.name || '',
            expertise: museum.expertise || 'basico',
            years: museum.years || 1,
            certificates: museum.certificates || []
          };
        }
        // Si es string (solo nombre del museo)
        if (typeof museum === 'string') {
          return { name: museum, expertise: 'basico', years: 1, certificates: [] };
        }
        return { name: '', expertise: 'basico', years: 1, certificates: [] };
      });
    }

    return {
      fullName,
      dni,
      phone: guide.phone || '',
      email: guide.email || '',
      address: guide.address || '',
      guideType,
      languages: formLanguages,
      museums: formMuseums
    };
  };

  const transformedGuide = transformGuideData(guide);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors }
  } = useForm({
    defaultValues: {
      fullName: transformedGuide?.fullName || '',
      dni: transformedGuide?.dni || '',
      phone: transformedGuide?.phone || '',
      email: transformedGuide?.email || '',
      address: transformedGuide?.address || '',
      guideType: transformedGuide?.guideType || 'FREELANCE',
      languages: transformedGuide?.languages || [{ code: '', level: 'principiante' }],
      museums: transformedGuide?.museums || [{ name: '', expertise: 'basico', years: 1, certificates: [] }]
    }
  });

  const {
    fields: languageFields,
    append: appendLanguage,
    remove: removeLanguage
  } = useFieldArray({
    control,
    name: 'languages'
  });

  const {
    fields: museumFields,
    append: appendMuseum,
    remove: removeMuseum
  } = useFieldArray({
    control,
    name: 'museums'
  });

  const watchedLanguages = watch('languages');
  const watchedMuseums = watch('museums');

  const getAvailableLanguages = (currentIndex) => {
    const selectedCodes = watchedLanguages
      .map((lang, index) => index !== currentIndex ? lang.code : null)
      .filter(Boolean);
    
    return languages.filter(lang => !selectedCodes.includes(lang.code));
  };

  const onSubmit = (data) => {
    const guideData = {
      fullName: data.fullName,
      dni: data.dni,
      phone: data.phone,
      email: data.email,
      address: data.address,
      guideType: data.guideType,
      specializations: {
        languages: data.languages.filter(lang => lang.code && lang.level),
        museums: data.museums.filter(museum => museum.name && museum.expertise)
      }
    };

    onSave(guideData);
  };

  const validationRules = {
    fullName: {
      required: 'El nombre completo es requerido'
    },
    dni: {
      required: 'El DNI es requerido',
      pattern: {
        value: DNI_REGEX,
        message: 'El DNI debe tener exactamente 8 dígitos'
      }
    },
    phone: {
      required: 'El teléfono es requerido',
      pattern: {
        value: PHONE_REGEX,
        message: 'El teléfono debe tener exactamente 9 dígitos'
      }
    },
    email: {
      required: 'El email es requerido',
      pattern: {
        value: EMAIL_REGEX,
        message: 'El formato del email no es válido'
      }
    },
    address: {
      required: 'La dirección es requerida'
    },
    guideType: {
      required: 'El tipo de guía es requerido'
    }
  };

  return {
    register,
    handleSubmit,
    control,
    errors,
    activeTab,
    setActiveTab,
    languageFields,
    appendLanguage,
    removeLanguage,
    museumFields,
    appendMuseum,
    removeMuseum,
    watchedLanguages,
    watchedMuseums,
    getAvailableLanguages,
    onSubmit,
    validationRules,
    languages,
    museums,
    watch,
    isLoadingLanguages,
    setValue
  };
};

export default useGuideForm;