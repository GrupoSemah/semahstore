import { nanoid } from 'nanoid';

// Generar un token CSRF único
export function generateCSRFToken() {
  return nanoid(32);
}

// Almacenar tokens en memoria (en producción usarías Redis o una base de datos)
const csrfTokens = new Map();

// Generar y almacenar un nuevo token asociado a una sesión
export function createCSRFToken(sessionId) {
  const token = generateCSRFToken();
  csrfTokens.set(sessionId, token);
  
  // Limpiar tokens antiguos (después de 1 hora)
  setTimeout(() => {
    csrfTokens.delete(sessionId);
  }, 3600000);
  
  return token;
}

// Verificar si un token CSRF es válido
export function validateCSRFToken(token, sessionId) {
  const storedToken = csrfTokens.get(sessionId);
  return token === storedToken;
}
