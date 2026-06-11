import React from 'react';
import { PlusIcon, XMarkIcon, MapPinIcon, ClockIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

const StopsManager = ({ stops = [], onChange, errors }) => {
  const { t } = useTranslation();
  // Generar ID único para nueva parada
  const generateStopId = () => `stop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Agregar nueva parada
  const addStop = () => {
    const newStop = {
      id: generateStopId(),
      order: stops.length + 1,
      name: '',
      duration: 30,
      description: ''
    };
    onChange([...stops, newStop]);
  };

  // Eliminar parada
  const removeStop = (stopId) => {
    const updatedStops = stops
      .filter(stop => stop.id !== stopId)
      .map((stop, index) => ({ ...stop, order: index + 1 }));
    onChange(updatedStops);
  };

  // Actualizar parada
  const updateStop = (stopId, field, value) => {
    const updatedStops = stops.map(stop =>
      stop.id === stopId ? { ...stop, [field]: value } : stop
    );
    onChange(updatedStops);
  };

  // Mover parada arriba
  const moveUp = (index) => {
    if (index === 0) return;
    const newStops = [...stops];
    [newStops[index - 1], newStops[index]] = [newStops[index], newStops[index - 1]];
    // Actualizar orden
    const reorderedStops = newStops.map((stop, idx) => ({ ...stop, order: idx + 1 }));
    onChange(reorderedStops);
  };

  // Mover parada abajo
  const moveDown = (index) => {
    if (index === stops.length - 1) return;
    const newStops = [...stops];
    [newStops[index], newStops[index + 1]] = [newStops[index + 1], newStops[index]];
    // Actualizar orden
    const reorderedStops = newStops.map((stop, idx) => ({ ...stop, order: idx + 1 }));
    onChange(reorderedStops);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
          {stops.length}
        </span>
      </div>

      {/* Lista de paradas */}
      <div className="space-y-4">
        {stops.map((stop, index) => (
          <div
            key={stop.id}
            className="bg-white rounded-xl p-5 border-2 border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-4">
              {/* Número de orden */}
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                  {index + 1}
                </div>
              </div>

              {/* Contenido de la parada */}
              <div className="flex-1 space-y-3">
                {/* Primera fila: Nombre y duración */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="sr-only">{t('services.stops.nameLabel')}</label>
                    <div className="relative">
                      <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={stop.name}
                        onChange={(e) => updateStop(stop.id, 'name', e.target.value)}
                        placeholder={t('services.stops.namePlaceholder')}
                        className="pl-11 pr-3 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="sr-only">{t('settings.tours.defaultDuration')}</label>
                    <div className="relative">
                      <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="number"
                        value={stop.duration}
                        onChange={(e) => updateStop(stop.id, 'duration', parseInt(e.target.value) || 0)}
                        placeholder="30"
                        min="0"
                        className="pl-11 pr-12 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 hover:bg-white"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-500 font-medium">
                        {t('services.stops.minutesShort')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Segunda fila: Descripción */}
                <div>
                  <label className="sr-only">{t('services.description')}</label>
                  <textarea
                    value={stop.description}
                    onChange={(e) => updateStop(stop.id, 'description', e.target.value)}
                    placeholder={t('services.stops.descriptionPlaceholder')}
                    rows="2"
                    className="px-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all bg-gray-50 hover:bg-white"
                  />
                </div>
              </div>

              {/* Controles de orden y eliminar */}
              <div className="flex-shrink-0 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className={`p-2 rounded-lg transition-all ${
                    index === 0
                      ? 'text-gray-300 cursor-not-allowed bg-gray-100'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 shadow-sm'
                  }`}
                  title={t('services.stops.moveUp')}
                >
                  <ChevronUpIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(index)}
                  disabled={index === stops.length - 1}
                  className={`p-2 rounded-lg transition-all ${
                    index === stops.length - 1
                      ? 'text-gray-300 cursor-not-allowed bg-gray-100'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 shadow-sm'
                  }`}
                  title={t('services.stops.moveDown')}
                >
                  <ChevronDownIcon className="h-5 w-5" />
                </button>
                <div className="h-px bg-gray-200 my-1"></div>
                <button
                  type="button"
                  onClick={() => removeStop(stop.id)}
                  className="p-2 rounded-lg text-red-500 hover:text-white hover:bg-red-500 transition-all shadow-sm"
                  title={t('common.delete')}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Botón agregar parada */}
      <button
        type="button"
        onClick={addStop}
        className="w-full py-4 border-2 border-dashed border-blue-300 rounded-xl text-blue-600 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all flex items-center justify-center gap-2 font-medium group"
      >
        <div className="p-1 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
          <PlusIcon className="h-5 w-5" />
        </div>
        <span>{t('services.stops.addStop')}</span>
      </button>

      {/* Mensaje de error si existe */}
      {errors && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 flex items-center">
            <span className="mr-2">⚠</span> {errors}
          </p>
        </div>
      )}

      {/* Información de ayuda */}
      {stops.length === 0 && (
        <div className="text-center py-8 px-4 bg-blue-50 rounded-xl border-2 border-dashed border-blue-200">
          <MapPinIcon className="h-12 w-12 text-blue-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 font-medium mb-1">
            {t('services.stops.emptyTitle')}
          </p>
          <p className="text-xs text-gray-500">
            {t('services.stops.emptyHint')}
          </p>
        </div>
      )}
    </div>
  );
};

export default StopsManager;