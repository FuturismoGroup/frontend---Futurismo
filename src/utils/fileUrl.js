/**
 * Resuelve URLs de archivos servidos por el backend (Wasabi vía /api/files,
 * o uploads legacy en /uploads/) al dominio correcto según el entorno.
 *
 * - URLs absolutas (http://, https://, data:, blob:) se devuelven tal cual.
 * - URLs relativas que empiezan con "/" se prefijan con el host del backend.
 *   En dev este host viene de VITE_API_URL=http://localhost:4025/api → http://localhost:4025
 *   En prod viene de VITE_API_URL=https://backend-....railway.app/api → https://backend-....railway.app
 * - Otros valores (vacíos, strings sin slash) se devuelven sin cambios.
 *
 * Así las URLs guardadas en la BD permanecen relativas (/api/files/rewards/...)
 * y funcionan tanto en local como desplegadas en Railway sin acoplarse al dominio.
 */
export function resolveFileUrl(url) {
  if (!url || typeof url !== 'string') return url;

  // Absolutas o data/blob → no tocar
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  // Relativa que empieza con "/": prefijar con host del backend
  if (url.startsWith('/')) {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    // VITE_API_URL es "<host>/api"; nos quedamos con "<host>"
    const backendHost = apiUrl.replace(/\/api\/?$/, '');
    return `${backendHost}${url}`;
  }

  return url;
}

export default resolveFileUrl;
