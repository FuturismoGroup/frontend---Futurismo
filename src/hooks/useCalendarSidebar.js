import { useState, useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import useIndependentAgendaStore from '../stores/independentAgendaStore';
import useGuidesStore from '../stores/guidesStore';

const useCalendarSidebar = ({ hideGuides = false } = {}) => {
  const { user } = useAuthStore();
  const { currentGuide, actions: { setCurrentGuide } } = useIndependentAgendaStore();
  const { guides: guidesData, fetchGuides } = useGuidesStore();

  const [expandedSections, setExpandedSections] = useState({
    calendars: true,
    guides: true,
    filters: false
  });

  const [visibleCalendars, setVisibleCalendars] = useState({
    personal: true,
    company: true,
    reservations: true
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'administrator';
  const isAgency = user?.role === 'agency';
  const canListGuides = isAdmin || isAgency;

  // Load guides from API - solo si tiene permisos y la lista no está oculta
  useEffect(() => {
    if (canListGuides && !hideGuides) {
      fetchGuides();
    }
  }, [fetchGuides, canListGuides, hideGuides]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleCalendarVisibility = (calendarType) => {
    setVisibleCalendars(prev => ({
      ...prev,
      [calendarType]: !prev[calendarType]
    }));
  };

  // Transform guides data to the format needed by the sidebar
  const guides = (guidesData || []).map(guide => ({
    id: guide.id,
    name: guide.name || `${guide.firstName || ''} ${guide.lastName || ''}`.trim(),
    online: guide.isOnline || guide.online || false,
    role: guide.type || guide.guideType || 'freelance'
  }));

  return {
    expandedSections,
    visibleCalendars,
    currentGuide,
    guides,
    isAdmin,
    canListGuides,
    toggleSection,
    toggleCalendarVisibility,
    setCurrentGuide
  };
};

export default useCalendarSidebar;