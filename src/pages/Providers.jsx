import { useEffect } from 'react';
import ProvidersManager from '../components/providers/ProvidersManager';

const Providers = () => {
  useEffect(() => {
    document.title = 'Gestión de Proveedores - Futurismo';
  }, []);

  return (
    <div className="w-full">
      <ProvidersManager />
    </div>
  );
};

export default Providers;