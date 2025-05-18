export const prerender = false;

import { createCSRFToken } from "@/lib/csrf";
import { nanoid } from "nanoid";

export async function GET({ cookies }) {
  try {
    // Obtener o crear un ID de sesión
    let sessionId = cookies.get('semah_session');
    if (!sessionId) {
      sessionId = nanoid(16);
      cookies.set('semah_session', sessionId, { 
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 3600 // 1 hora
      });
    }
    
    // Generar un token CSRF para esta sesión
    const csrfToken = createCSRFToken(sessionId);
    
    return new Response(
      JSON.stringify({ 
        token: csrfToken,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error("Error al generar token CSRF:", error);
    return new Response(
      JSON.stringify({
        error: "Error al generar token CSRF",
        message: error.message
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
}
