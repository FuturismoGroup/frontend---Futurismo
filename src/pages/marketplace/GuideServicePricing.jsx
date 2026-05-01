import { useState, useEffect } from 'react';
import { CurrencyDollarIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import useAuthStore from '../../stores/authStore';
import useMarketplaceStore from '../../stores/marketplaceStore';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const GuideServicePricing = () => {
  const { user } = useAuthStore();
  const { currentGuide, isLoading, fetchGuideProfile, updateGuideRate } = useMarketplaceStore();

  const [pricePerPerson, setPricePerPerson] = useState('');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const guideId = user?.guideId;

  useEffect(() => {
    if (!guideId) return;

    fetchGuideProfile(guideId)
      .then((guide) => {
        if (guide?.pricePerPerson) {
          setPricePerPerson(String(guide.pricePerPerson));
        }
        setLoaded(true);
      })
      .catch(() => {
        setLoaded(true);
      });
  }, [guideId]);

  const handleSave = async (e) => {
    e.preventDefault();

    const parsed = parseFloat(pricePerPerson);
    if (!pricePerPerson || isNaN(parsed) || parsed <= 0) {
      toast.error('Ingresa un precio valido mayor a 0');
      return;
    }

    setSaving(true);
    try {
      await updateGuideRate(guideId, parsed);
      toast.success('Tarifa actualizada correctamente');
    } catch (err) {
      toast.error(err.message || 'Error al guardar la tarifa');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !loaded) {
    return <LoadingSpinner />;
  }

  const currentRate = currentGuide?.pricePerPerson;
  const hasNoRate = !currentRate || currentRate <= 0;

  return (
    <div className="max-w-xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi Tarifa</h1>
        <p className="text-gray-500 mt-1">
          Configura tu tarifa por persona para el marketplace
        </p>
      </div>

      {/* Aviso si no tiene tarifa */}
      {hasNoRate && loaded && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            No tienes una tarifa configurada. Debes establecer tu precio por persona para
            aparecer en el marketplace y recibir solicitudes de agencias.
          </p>
        </div>
      )}

      {/* Formulario */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label
              htmlFor="pricePerPerson"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Precio por persona (S/)
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="pricePerPerson"
                type="number"
                step="0.01"
                min="0.01"
                value={pricePerPerson}
                onChange={(e) => setPricePerPerson(e.target.value)}
                placeholder="60.00"
                className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full px-4 py-2.5 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
          >
            {saving ? 'Guardando...' : 'Guardar tarifa'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default GuideServicePricing;
