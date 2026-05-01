import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')

  // Proxy target: se lee de VITE_API_URL segun el entorno activo
  // - npm run dev  -> carga .env.development (localhost:4025)
  // - npm run build -> carga .env.production (Railway)
  const getProxyTarget = () => {
    if (env.VITE_API_URL) {
      return env.VITE_API_URL.replace('/api', '')
    }
    return 'http://localhost:4025'
  }

  return {
    plugins: [react()],
    server: {
      port: 3025,
      host: true,
      strictPort: false,
      hmr: {
        overlay: false, // Deshabilitar overlay de errores que puede causar reloads
      },
      // Proxy para desarrollo local (evita CORS)
      proxy: {
        '/api': {
          target: getProxyTarget(),
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: getProxyTarget(),
          changeOrigin: true,
          secure: false,
        }
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined
        }
      }
    },
    // Configuración para producción (Railway)
    preview: {
      port: parseInt(process.env.PORT) || 3025,
      host: true,
      strictPort: true,
      allowedHosts: [
        'frontend-futurismo-final-production.up.railway.app',
        'frontend-futurismo-final-production-f971.up.railway.app',
        '.railway.app'
      ]
    }
  }
})