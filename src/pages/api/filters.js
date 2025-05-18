// Agregar esta línea al principio del archivo
export const prerender = false

import { getFilterOptions } from "@/lib/device"

export async function GET() {
  try {
    const filters = await getFilterOptions()

    console.log("API: Filtros obtenidos:", filters)

    return new Response(JSON.stringify(filters), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    })
  } catch (error) {
    console.error("Error obteniendo filtros:", error)
    return new Response(
      JSON.stringify({
        error: "Error al obtener los filtros",
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      },
    )
  }
}

