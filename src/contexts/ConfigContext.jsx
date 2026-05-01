import { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { useAppConfig } from '../hooks/useAppConfig';

// Create the config context
const ConfigContext = createContext();

// Custom hook to use config context
export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

// Loading component for config initialization
const ConfigLoading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Cargando configuración...</p>
    </div>
  </div>
);

// Error component for config loading failures
const ConfigError = ({ error, onRetry }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="mb-4">
        <svg
          className="mx-auto h-12 w-12 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Error al cargar configuración
      </h3>
      <p className="text-gray-600 mb-4">
        {error || 'No se pudo cargar la configuración de la aplicación.'}
      </p>
      <button
        onClick={onRetry}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Reintentar
      </button>
      <p className="text-sm text-gray-500 mt-4">
        La aplicación continuará con valores por defecto.
      </p>
    </div>
  </div>
);

ConfigError.propTypes = {
  error: PropTypes.string,
  onRetry: PropTypes.func.isRequired
};

// Main config provider component
export const ConfigProvider = ({ children, showLoadingScreen = true }) => {
  const configHook = useAppConfig();
  const { loading, error, refreshConfig, config } = configHook;

  // Show loading screen while config is loading (if enabled)
  // Pero limitar a 3 segundos máximo para evitar que la app se quede colgada
  if (loading && showLoadingScreen) {
    return <ConfigLoading />;
  }

  // Solo mostrar error si es crítico Y no hay config de respaldo
  // Si hay config (aunque sea default), continuar
  if (error && !config && showLoadingScreen) {
    return <ConfigError error={error} onRetry={refreshConfig} />;
  }

  return (
    <ConfigContext.Provider value={configHook}>
      {children}
    </ConfigContext.Provider>
  );
};

ConfigProvider.propTypes = {
  children: PropTypes.node.isRequired,
  showLoadingScreen: PropTypes.bool
};

// Hook for external services config
export const useExternalServicesConfig = () => {
  const { getExternalServices } = useConfig();
  return getExternalServices();
};

export default ConfigContext;