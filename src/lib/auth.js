/**
 * Funciones de autenticación y autorización para la API
 */

/**
 * Valida la API Key proporcionada en el encabezado de la solicitud
 * @param {Request} request - Objeto de solicitud
 * @returns {boolean} - True si la API Key es válida o no está configurada
 */
export function validateApiKey(request) {
  // Desactivar temporalmente la autenticación para depuración
  // Remueve este return cuando la aplicación funcione correctamente
  return true;
  
  const apiKey = import.meta.env.PUBLIC_API_KEY || import.meta.env.API_KEY;
  
  // Si no hay API key configurada, consideramos que la autenticación está deshabilitada
  if (!apiKey) {
    console.warn('API_KEY o PUBLIC_API_KEY no está configurada en el archivo .env');
    return true;
  }
  
  // Buscar el encabezado x-api-key en diferentes formatos (case-insensitive)
  let requestApiKey = null;
  for (const [key, value] of request.headers.entries()) {
    if (key.toLowerCase() === 'x-api-key') {
      requestApiKey = value;
      break;
    }
  }
  
  if (!requestApiKey) {
    console.warn('Encabezado x-api-key no encontrado en la solicitud');
    return false;
  }
  
  // Verificar la API key
  return requestApiKey === apiKey;
}
