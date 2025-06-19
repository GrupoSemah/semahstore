export const prerender = false;

/**
 * Endpoint para verificar la contraseña de administración
 */
export async function POST({ request }) {
  // Configurar encabezados CORS para permitir solicitudes
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };
  
  // Manejar solicitudes OPTIONS (preflight)
  if (request.method === "OPTIONS") {
    return new Response(null, { headers, status: 204 });
  }
  try {
    // Verificamos que sea un JSON válido
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.toLowerCase().includes("application/json")) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Content-Type debe ser application/json",
          receivedContentType: contentType || "no especificado",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Obtenemos la contraseña del cuerpo de la petición
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No se proporcionó contraseña",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Obtener la clave de autenticación desde la variable de entorno
    // En Astro, las variables de entorno públicas deben tener el prefijo PUBLIC_
    const authKey = import.meta.env.PUBLIC_AUTH_KEY || import.meta.env.AUTH_KEY;
    
    // Agregar logs para depuración
    console.log("Verificando autenticación:");
    console.log("- Variables de entorno disponibles:", Object.keys(import.meta.env).filter(key => !key.includes('_')));
    console.log("- Contraseña proporcionada por el usuario", password);
    console.log("- ¿Existe AUTH_KEY?", !!import.meta.env.AUTH_KEY);
    console.log("- ¿Existe PUBLIC_AUTH_KEY?", !!import.meta.env.PUBLIC_AUTH_KEY);

    if (!authKey) {
      console.error("AUTH_KEY no está configurada en las variables de entorno");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Error de configuración del servidor",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Comparar la contraseña proporcionada con la variable de entorno
    const isValid = password === authKey;

    return new Response(
      JSON.stringify({
        success: isValid,
        message: isValid ? "Contraseña correcta" : "Contraseña incorrecta",
      }),
      {
        status: isValid ? 200 : 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error al verificar la contraseña:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: "Error interno del servidor",
        error: process.env.NODE_ENV === "development" ? error.toString() : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
