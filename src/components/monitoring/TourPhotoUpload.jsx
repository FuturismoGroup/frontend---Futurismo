import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CameraIcon, MapPinIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const TourPhotoUpload = ({ stopId, stopName, requiredLocation, onPhotoUploaded, isRequired = false }) => {
  const { t } = useTranslation();
  const [photos, setPhotos] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const fileInputRef = useRef(null);

  // Verificar geolocalización
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error(t('validation.geolocationNotSupported')));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date()
          };
          resolve(location);
        },
        (error) => {
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        }
      );
    });
  };

  // Calcular distancia entre dos coordenadas (en metros)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  };

  // Verificar si está en la ubicación correcta
  const isAtCorrectLocation = (currentLoc, requiredLoc, tolerance = 100) => {
    if (!currentLoc || !requiredLoc) return false;
    
    const distance = calculateDistance(
      currentLoc.latitude, currentLoc.longitude,
      requiredLoc.latitude, requiredLoc.longitude
    );
    
    return distance <= tolerance;
  };

  const handleTakePhoto = async () => {
    try {
      setIsUploading(true);
      setLocationError(null);

      // Obtener ubicación actual
      const location = await getCurrentLocation();
      setCurrentLocation(location);

      // Si es punto obligatorio, verificar ubicación
      if (isRequired && requiredLocation) {
        const isAtLocation = isAtCorrectLocation(location, requiredLocation, 50); // 50 metros de tolerancia
        
        if (!isAtLocation) {
          const distance = calculateDistance(
            location.latitude, location.longitude,
            requiredLocation.latitude, requiredLocation.longitude
          );
          
          setLocationError(t('monitoring.comp.distanceError', { distance: Math.round(distance) }));
          toast.error(t('validation.locationNotCorrect'));
          return;
        }
      }

      // Abrir cámara/galería
      fileInputRef.current?.click();
      
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationError(t('validation.locationError') + ': ' + error.message);
      toast.error(t('validation.locationError'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);

      // Crear objeto de foto con metadatos
      const photoData = {
        id: Date.now(),
        file,
        fileName: file.name,
        size: file.size,
        type: file.type,
        stopId,
        stopName,
        location: currentLocation,
        timestamp: new Date(),
        isRequired,
        url: URL.createObjectURL(file)
      };

      // Agregar a la lista local
      setPhotos(prev => [...prev, photoData]);

      // Notificar al componente padre
      onPhotoUploaded?.(photoData);

      toast.success(isRequired ? t('monitoring.comp.photoRequired') : t('monitoring.comp.photoUploaded'));
      
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error(t('errors.unexpectedError'));
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (photoId) => {
    setPhotos(prev => prev.filter(p => p.id !== photoId));
    toast.success(t('monitoring.comp.photoDeleted'));
  };

  return (
    <div className="space-y-4">
      {/* Botón para tomar foto */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-900">
            {isRequired ? t('monitoring.comp.photosRequired') : t('monitoring.comp.photosLabel')}
          </h4>
          {isRequired && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
              {t('monitoring.comp.required')}
            </span>
          )}
        </div>
        
        <button
          onClick={handleTakePhoto}
          disabled={isUploading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isRequired 
              ? 'bg-red-600 hover:bg-red-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <CameraIcon className="w-4 h-4" />
          {isUploading ? t('monitoring.comp.locating') : t('monitoring.comp.takePhoto')}
        </button>
      </div>

      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Error de ubicación */}
      {locationError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">{t('monitoring.comp.locationErrorTitle')}</p>
              <p className="text-sm text-red-700">{locationError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Información de ubicación actual */}
      {currentLocation && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <MapPinIcon className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">{t('monitoring.comp.locationVerified')}</p>
              <p className="text-sm text-green-700">
                {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
              </p>
              <p className="text-xs text-green-600">
                {t('monitoring.comp.precision')}: ±{Math.round(currentLocation.accuracy)}m
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de fotos subidas */}
      {photos.length > 0 && (
        <div className="space-y-3">
          <h5 className="font-medium text-gray-900">{t('monitoring.comp.photosUploaded')} ({photos.length})</h5>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.url}
                  alt={`Foto de ${photo.stopName}`}
                  className="w-full h-24 object-cover rounded-lg border border-gray-200"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center">
                  <button
                    onClick={() => removePhoto(photo.id)}
                    className="opacity-0 group-hover:opacity-100 text-white bg-red-600 rounded-full p-1 transition-opacity"
                  >
                    ×
                  </button>
                </div>
                
                {/* Metadatos de la foto */}
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-75 text-white text-xs p-1 rounded-b-lg">
                  <div className="flex items-center justify-between">
                    <span>{photo.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    {photo.isRequired && <CheckCircleIcon className="w-3 h-3 text-green-400" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TourPhotoUpload;