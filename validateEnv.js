/**
 * Script de validación de variables de entorno para Frontend
 * Verifica que todas las variables críticas estén presentes en .env
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Variables requeridas
const REQUIRED_ENV_VARS = [
  'VITE_API_URL',
  'VITE_APP_NAME',
  'VITE_APP_VERSION'
];

// Variables recomendadas
const RECOMMENDED_ENV_VARS = [
  'VITE_WS_URL',
  'VITE_APP_ENV',
  'VITE_API_TIMEOUT',
  'VITE_STORAGE_PREFIX'
];

// Variables opcionales
const OPTIONAL_ENV_VARS = [
  'VITE_GOOGLE_MAPS_API_KEY',
  'VITE_ENABLE_DEBUG_MODE',
  'VITE_ENABLE_ANALYTICS'
];

function parseEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const env = {};

    content.split('\n').forEach(line => {
      line = line.trim();
      // Ignorar comentarios y líneas vacías
      if (!line || line.startsWith('#')) return;

      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    });

    return env;
  } catch (error) {
    console.error(`❌ Error leyendo archivo ${filePath}:`, error.message);
    return null;
  }
}

function validateEnv() {
  console.log('🔍 Validando variables de entorno del Frontend...\n');

  const envPath = resolve(process.cwd(), '.env');
  const envExamplePath = resolve(process.cwd(), '.env.example');

  // Leer archivos
  const envVars = parseEnvFile(envPath);
  const envExampleVars = parseEnvFile(envExamplePath);

  if (!envVars) {
    console.error('❌ No se pudo leer el archivo .env');
    process.exit(1);
  }

  const errors = [];
  const warnings = [];
  const info = [];

  console.log('📋 Variables encontradas en .env:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Validar variables requeridas
  REQUIRED_ENV_VARS.forEach(varName => {
    if (!envVars[varName] || envVars[varName] === '') {
      errors.push(`❌ Variable requerida faltante o vacía: ${varName}`);
    } else {
      console.log(`✅ ${varName}: ${envVars[varName]}`);
    }
  });

  // Validar variables recomendadas
  RECOMMENDED_ENV_VARS.forEach(varName => {
    if (!envVars[varName] || envVars[varName] === '') {
      warnings.push(`⚠️  Variable recomendada no definida: ${varName}`);
    } else {
      console.log(`✅ ${varName}: ${envVars[varName]}`);
    }
  });

  // Informar sobre variables opcionales
  OPTIONAL_ENV_VARS.forEach(varName => {
    if (envVars[varName]) {
      console.log(`✅ ${varName}: ${envVars[varName]}`);
    } else {
      info.push(`ℹ️  Variable opcional no definida: ${varName}`);
    }
  });

  console.log('');

  // Validaciones específicas
  if (envVars.VITE_API_URL) {
    try {
      new URL(envVars.VITE_API_URL);
    } catch {
      // Si no es una URL completa, podría ser una ruta relativa
      if (!envVars.VITE_API_URL.startsWith('/')) {
        errors.push(`❌ VITE_API_URL no es una URL válida ni una ruta relativa: ${envVars.VITE_API_URL}`);
      }
    }
  }

  if (envVars.VITE_WS_URL) {
    if (!envVars.VITE_WS_URL.startsWith('ws://') && !envVars.VITE_WS_URL.startsWith('wss://') && !envVars.VITE_WS_URL.startsWith('http://') && !envVars.VITE_WS_URL.startsWith('https://')) {
      warnings.push(`⚠️  VITE_WS_URL debería comenzar con ws://, wss://, http:// o https://`);
    }
  }

  // Comparar con .env.example
  if (envExampleVars) {
    const exampleKeys = Object.keys(envExampleVars);
    const envKeys = Object.keys(envVars);

    const missingFromEnv = exampleKeys.filter(key => !envKeys.includes(key));
    const extraInEnv = envKeys.filter(key => !exampleKeys.includes(key));

    if (missingFromEnv.length > 0) {
      warnings.push(`⚠️  Variables en .env.example pero no en .env: ${missingFromEnv.join(', ')}`);
    }

    if (extraInEnv.length > 0) {
      info.push(`ℹ️  Variables en .env pero no en .env.example: ${extraInEnv.join(', ')}`);
    }
  }

  // Mostrar resumen
  console.log('\n📊 Resumen de validación:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (errors.length > 0) {
    console.log('\n🚨 ERRORES CRÍTICOS:');
    errors.forEach(error => console.log(error));
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  ADVERTENCIAS:');
    warnings.forEach(warning => console.log(warning));
  }

  if (info.length > 0) {
    console.log('\nℹ️  INFORMACIÓN:');
    info.forEach(i => console.log(i));
  }

  if (errors.length === 0 && warnings.length === 0 && info.length === 0) {
    console.log('\n✅ Todas las variables de entorno están correctamente configuradas');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Retornar código de salida
  if (errors.length > 0) {
    console.log('❌ La validación falló. Por favor, corrige los errores antes de continuar.\n');
    process.exit(1);
  } else if (warnings.length > 0) {
    console.log('⚠️  La validación pasó con advertencias.\n');
    process.exit(0);
  } else {
    console.log('✅ La validación pasó exitosamente.\n');
    process.exit(0);
  }
}

// Ejecutar validación
validateEnv();
