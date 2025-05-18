/**
 * Sanitiza contenido de texto para prevenir ataques XSS
 * @param {string} content - El contenido a sanitizar
 * @returns {string} - El contenido sanitizado
 */
export function sanitizeContent(content) {
  if (!content || typeof content !== 'string') return '';
  
  // Reemplaza caracteres que podrían ser usados para XSS
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitiza un objeto completo para prevenir ataques XSS
 * @param {object} obj - El objeto a sanitizar
 * @returns {object} - Una copia sanitizada del objeto
 */
export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  // Si es un array, sanitizamos cada elemento
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  // Si es un objeto, sanitizamos cada propiedad
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeContent(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}
