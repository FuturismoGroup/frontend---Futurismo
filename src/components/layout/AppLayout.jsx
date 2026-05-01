import React from 'react';
import PropTypes from 'prop-types';
import { Outlet } from 'react-router-dom';
import { useLayout } from '../../contexts/LayoutContext';
import AppSidebarEnhanced from './AppSidebarEnhanced';
import AppHeader from './AppHeader';

const AppLayout = () => {
  const { sidebarOpen, closeSidebar, viewport } = useLayout();

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-100 flex flex-col md:flex-row relative overflow-x-hidden">
      {/* Mobile Overlay */}
      {viewport.isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/70 z-40 md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Mobile Sidebar */}
      <aside 
        className={`
          md:hidden
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          fixed inset-y-0 left-0 z-50 w-64 sm:w-72
          transform transition-transform duration-300 ease-in-out
        `}
        aria-label="Main navigation"
      >
        <div className="h-full bg-card-gradient backdrop-blur-md border-r border-white/20 shadow-large">
          <AppSidebarEnhanced />
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside 
        className="hidden md:block relative w-80 h-screen flex-shrink-0"
        aria-label="Main navigation"
      >
        <div className="h-full bg-card-gradient backdrop-blur-md border-r border-white/20 shadow-large">
          <AppSidebarEnhanced />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="flex-shrink-0 z-30 bg-card-gradient backdrop-blur-md border-b border-white/20 shadow-soft">
          <AppHeader />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="h-full p-4 lg:p-6">
            <div className="h-full animate-fade-in">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;