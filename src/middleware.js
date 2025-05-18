import { defineMiddleware } from 'astro:middleware';
import { validateCSRFToken } from './lib/csrf';
import { validateApiKey } from './lib/auth';

// Implementación básica de rate limiting en memoria
// En producción usarías Redis o un servicio dedicado
const rateLimit = new Map();

// Configuración del rate limiting
const RATE_LIMIT_WINDOW = 60000; // 1 minuto en milisegundos
const MAX_REQUESTS_PER_WINDOW = 60; // 60 peticiones por minuto

// Límites diferentes por ruta para mayor protección
const ROUTE_LIMITS = {
  '/api/reservations': 30, // Menos peticiones para operaciones críticas
  '/api/filters': 100, // Más permisos para filtros que son menos críticos
};

// Encabezados de seguridad mejorados para todas las respuestas HTML
const securityHeaders = {
  // Política CSP mejorada con más restricciones y opciones
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self' https://*.vercel.app; frame-ancestors 'self'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests;",
  
  // Protección contra MIME sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Protección contra clickjacking
  'X-Frame-Options': 'SAMEORIGIN',
  
  // Protección XSS heredada (para navegadores antiguos)
  'X-XSS-Protection': '1; mode=block',
  
  // Política de referencia mejorada
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Restricciones de características del navegador
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), autoplay=(), document-domain=()',
  
  // HSTS para forzar HTTPS
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Evitar información de versión del servidor
  'Server': 'SEMAH-WebServer'
};

export const onRequest = defineMiddleware(async (context, next) => {
  const { request } = context;
  const url = new URL(request.url);
  
  // Aplicamos rate limiting y validación API Key solo a endpoints de API
  if (url.pathname.startsWith('/api/')) {
    // Verificar API Key para todas las solicitudes a la API
    if (!validateApiKey(request)) {
      return new Response(
        JSON.stringify({ error: "API Key inválida o faltante" }),
        { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('cf-connecting-ip') || 
               request.headers.get('true-client-ip') || 
               'unknown';
    
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;
    
    // Obtener historial de peticiones para esta IP
    const requestHistory = rateLimit.get(ip) || [];
    const recentRequests = requestHistory.filter(time => time > windowStart);
    
    // Determinar el límite para esta ruta específica
    const pathLimit = Object.entries(ROUTE_LIMITS).find(([path, _]) => 
      url.pathname.startsWith(path)
    )?.[1] || MAX_REQUESTS_PER_WINDOW;
    
    // Verificar si excede el límite
    if (recentRequests.length >= pathLimit) {
      return new Response(
        JSON.stringify({ 
          error: "Demasiadas peticiones. Por favor, intenta más tarde.",
          retryAfter: Math.ceil((windowStart + RATE_LIMIT_WINDOW - now) / 1000)
        }),
        { 
          status: 429,
          headers: { 
            "Content-Type": "application/json",
            "Retry-After": Math.ceil((windowStart + RATE_LIMIT_WINDOW - now) / 1000).toString()
          }
        }
      );
    }
    
    // Actualizar el historial de peticiones
    recentRequests.push(now);
    rateLimit.set(ip, recentRequests);
    
    // Para endpoints de API que necesiten CSRF, verificar el token
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      // La verificación completa se hace en los endpoints
      // Aquí solo verificamos que el token esté presente
      const csrfToken = request.headers.get('x-csrf-token');
      if (!csrfToken) {
        return new Response(
          JSON.stringify({ error: "Token CSRF requerido" }),
          { 
            status: 403,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    }
  }
  
  // Continuar con la petición
  const response = await next();
  
  // Añadir encabezados de seguridad a respuestas HTML
  if (!url.pathname.startsWith('/api/') && 
      !url.pathname.includes('/_astro/') &&
      !url.pathname.includes('/_image')) {
    
    const newHeaders = new Headers(response.headers);
    
    // Añadir encabezados de seguridad
    Object.entries(securityHeaders).forEach(([key, value]) => {
      newHeaders.set(key, value);
    });
    
    // Crear nueva respuesta con los encabezados adicionales
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders
    });
  }
  
  return response;
});
