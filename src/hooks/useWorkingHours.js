import { useState, useEffect } from 'react';
import useIndependentAgendaStore from '../stores/independentAgendaStore';
import useAuthStore from '../stores/authStore';

const useWorkingHours = (isOpen) => {
  const { user } = useAuthStore();
  const { 
    workingHours,
    actions: { setWorkingHours }
  } = useIndependentAgendaStore();

  const defaultWorkingHours = {
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: true, start: '09:00', end: '17:00' },
    saturday: { enabled: false, start: '10:00', end: '14:00' },
    sunday: { enabled: false, start: '10:00', end: '14:00' }
  };

  const [workingHoursForm, setWorkingHoursForm] = useState(defaultWorkingHours);

  // Load current user's working hours (use guideId for API calls)
  useEffect(() => {
    if (user?.guideId && workingHours[user.guideId] && isOpen) {
      // Convert Spanish day names to English for consistency
      const userHours = workingHours[user.guideId];
      const converted = {
        monday: userHours.lunes || defaultWorkingHours.monday,
        tuesday: userHours.martes || defaultWorkingHours.tuesday,
        wednesday: userHours.miercoles || defaultWorkingHours.wednesday,
        thursday: userHours.jueves || defaultWorkingHours.thursday,
        friday: userHours.viernes || defaultWorkingHours.friday,
        saturday: userHours.sabado || defaultWorkingHours.saturday,
        sunday: userHours.domingo || defaultWorkingHours.sunday
      };
      setWorkingHoursForm(converted);
    }
  }, [user?.guideId, workingHours, isOpen]);

  const handleSave = () => {
    if (user?.guideId) {
      // Convert back to Spanish for storage
      const spanishHours = {
        lunes: workingHoursForm.monday,
        martes: workingHoursForm.tuesday,
        miercoles: workingHoursForm.wednesday,
        jueves: workingHoursForm.thursday,
        viernes: workingHoursForm.friday,
        sabado: workingHoursForm.saturday,
        domingo: workingHoursForm.sunday
      };
      setWorkingHours(user.guideId, spanishHours);
      return true;
    }
    return false;
  };

  const resetForm = () => {
    if (user?.guideId && workingHours[user.guideId]) {
      const userHours = workingHours[user.guideId];
      const converted = {
        monday: userHours.lunes || defaultWorkingHours.monday,
        tuesday: userHours.martes || defaultWorkingHours.tuesday,
        wednesday: userHours.miercoles || defaultWorkingHours.wednesday,
        thursday: userHours.jueves || defaultWorkingHours.thursday,
        friday: userHours.viernes || defaultWorkingHours.friday,
        saturday: userHours.sabado || defaultWorkingHours.saturday,
        sunday: userHours.domingo || defaultWorkingHours.sunday
      };
      setWorkingHoursForm(converted);
    } else {
      setWorkingHoursForm(defaultWorkingHours);
    }
  };

  const updateDaySchedule = (day, field, value) => {
    setWorkingHoursForm(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value
      }
    }));
  };

  return {
    workingHoursForm,
    updateDaySchedule,
    handleSave,
    resetForm
  };
};

export default useWorkingHours;