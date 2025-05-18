/**
 * Funciones de autenticación y autorización para la API
 */

/**
 * Valida la API Key proporcionada en el encabezado de la solicitud
 * @param {Request} request - Objeto de solicitud
 * @returns {boolean} - True si la API Key es válida o no está configurada
 */
export function validateApiKey(request) {
  const apiKey = import.meta.env.API_KEY;
  
  // Si no hay API key configurada, consideramos que la autenticación está deshabilitada
  if (!apiKey) {
    console.warn('API_KEY no está configurada en el archivo .env');
    return true;
  }
  
  const requestApiKey = request.headers.get('x-api-key');
  
  // Verificar la API key
  return requestApiKey === apiKey;
}
