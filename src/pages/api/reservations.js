export const prerender = false

import { PrismaClient } from "@prisma/client"
import { sendReservationEmail } from "@/lib/email"
import { nanoid } from "nanoid"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const reservations = await prisma.reservation.findMany({
      include: {
        items: {
          include: {
            device: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return new Response(JSON.stringify(reservations), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    })
  } catch (error) {
    console.error("Error al obtener reservas:", error)
    return new Response(
      JSON.stringify({
        error: "Error al obtener las reservas",
        message: error.message
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    )
  }
}

export async function POST({ request }) {
  try {
    console.log("Headers recibidos:", Object.fromEntries(request.headers))
    const contentType = request.headers.get("content-type")
    console.log("Content-Type recibido:", contentType)

    if (!contentType || !contentType.toLowerCase().includes("application/json")) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Content-Type debe ser application/json",
          receivedContentType: contentType || "no especificado",
          headers: Object.fromEntries(request.headers),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const rawBody = await request.text()
    console.log("Body raw recibido:", rawBody)

    let body
    try {
      body = JSON.parse(rawBody)
    } catch (e) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Error al parsear JSON",
          error: e.message,
          receivedBody: rawBody,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    console.log("Body parseado:", body)

    const { customer, items, total } = body

    // Validar datos requeridos
    if (!customer?.name || !customer?.email || !customer?.phone || !items?.length || !total) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Faltan datos requeridos para la reserva",
          details: { customer, itemsLength: items?.length, total },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Generar código de reserva único
    const reservationCode = nanoid(10).toUpperCase()

    try {
      // Verificar stock disponible
      for (const item of items) {
        const device = await prisma.device.findUnique({
          where: { id: item.id },
        })

        if (!device) {
          throw new Error(`Dispositivo no encontrado: ${item.id}`)
        }

        if (device.stock < item.quantity) {
          throw new Error(
            `Stock insuficiente para el dispositivo ${device.name}. Disponible: ${device.stock}, Solicitado: ${item.quantity}`,
          )
        }
      }

      // Crear la reserva y actualizar stock en una transacción
      const reservation = await prisma.$transaction(async (tx) => {
        // Crear la reserva
        const newReservation = await tx.reservation.create({
          data: {
            code: reservationCode,
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            comments: customer.comments || "",
            total,
            items: {
              create: items.map((item) => ({
                quantity: item.quantity,
                price: item.price,
                deviceId: item.id,
              })),
            },
          },
          include: {
            items: {
              include: {
                device: true,
              },
            },
          },
        })

        // Actualizar stock
        for (const item of items) {
          await tx.device.update({
            where: { id: item.id },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          })
        }

        return newReservation
      })

      // Enviar correo de confirmación
      try {
        await sendReservationEmail({
          customer,
          items: items.map((item) => ({
            ...item,
            total: item.price * item.quantity,
          })),
          total,
          reservationCode,
        })
      } catch (emailError) {
        console.error("Error al enviar el correo:", emailError)
        // Continuamos aunque falle el envío del correo
      }

      return new Response(
        JSON.stringify({
          success: true,
          reservationCode,
          message: "Reserva creada exitosamente",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    } catch (error) {
      throw new Error(`Error procesando la reserva: ${error.message}`)
    }
  } catch (error) {
    console.error("Error completo:", error)
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Error al procesar la reserva",
        error: process.env.NODE_ENV === "development" ? error.toString() : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function PATCH({ request }) {
  try {
    const { id, status } = await request.json()

    if (!id || !status) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Se requiere ID y estado de la reserva"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: { status },
      include: {
        items: {
          include: {
            device: true
          }
        }
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        reservation: updatedReservation
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    )
  } catch (error) {
    console.error("Error actualizando reserva:", error)
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Error al actualizar la reserva"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}

