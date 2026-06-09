import React from 'react';
import PropTypes from 'prop-types';
import { Outlet } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import AppSidebarEnhanced from './AppSidebarEnhanced';
import AppHeader from './AppHeader';
import GuideLocationTracker from '../monitoring/GuideLocationTracker';

const AppLayout = () => {
  const { sidebarOpen, closeSidebar, viewport } = useLayout();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 flex flex-col lg:flex-row relative overflow-x-hidden">
      {/* Tracker GPS invisible: solo actúa para guías con tour in_progress. */}
      <GuideLocationTracker />
      {/* Mobile/Tablet Overlay - se muestra cuando el sidebar está abierto en <1024px */}
      {viewport.isCompact && sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/70 z-40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Mobile/Tablet Sidebar (overlay) */}
      <aside
        className={`
          lg:hidden
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          fixed inset-y-0 left-0 z-50 w-[85vw] max-w-[20rem] sm:w-72
          transform transition-transform duration-300 ease-in-out
        `}
        aria-label="Main navigation"
      >
        <div className="h-full bg-card-gradient backdrop-blur-md border-r border-white/20 shadow-large">
          <AppSidebarEnhanced />
        </div>
      </aside>

      {/* Desktop Sidebar (persistente >= 1024px) */}
      <aside
        className="hidden lg:block relative w-72 xl:w-80 h-screen flex-shrink-0"
        aria-label="Main navigation"
      >
        <div className="h-full bg-card-gradient backdrop-blur-md border-r border-white/20 shadow-large">
          <AppSidebarEnhanced />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        {/* Header */}
        <header className="flex-shrink-0 z-30 bg-card-gradient backdrop-blur-md border-b border-white/20 shadow-soft">
          <AppHeader />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="min-h-full p-3 sm:p-4 lg:p-6">
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;