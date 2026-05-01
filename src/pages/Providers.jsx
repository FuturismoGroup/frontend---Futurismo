import { useEffect } from 'react';
import ProvidersManager from '../components/providers/ProvidersManager';

const Providers = () => {
  useEffect(() => {
    document.title = 'Gestión de Proveedores - Futurismo';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <ProvidersManager />
    </div>
  );
};

export default Providers;