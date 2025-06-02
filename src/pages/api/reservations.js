export const prerender = false

import { PrismaClient } from "@prisma/client"
import { sendReservationEmail } from "@/lib/email"
import { nanoid } from "nanoid"
import { reservationSchema, reservationUpdateSchema, validateData } from "@/lib/validations"
import { sanitizeObject } from "@/lib/sanitize"

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
    // Verificar CSRF token
    const csrfToken = request.headers.get('x-csrf-token');
    if (!csrfToken) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Token CSRF no proporcionado",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
    
    // Verificar Content-Type
    const contentType = request.headers.get("content-type")
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
        },
      )
    }

    // Parsear y validar el cuerpo de la petición
    let body;
    try {
      body = await request.json();
      // Sanitizar datos para prevenir XSS
      body = sanitizeObject(body);
    } catch (e) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Error al parsear JSON",
          error: e.message,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    // Crear objeto de reserva con la estructura esperada por el esquema
    const { customer, items, total, comments } = body;
    const reservationData = {
      customerName: customer?.name,
      customerEmail: customer?.email,
      customerPhone: customer?.phone,
      comments: comments || null,
      items: items?.map(item => ({
        deviceId: item.id,
        quantity: item.quantity,
        price: item.price,
        originalPrice: item.originalPrice || item.price // Utilizar originalPrice si existe, sino el mismo precio
      })) || []
    };

    // Validar datos con Zod
    const validationResult = await reservationSchema.safeParse(reservationData);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Datos de reserva inválidos",
          errors: validationResult.error.format(),
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
                originalPrice: item.originalPrice || item.price, // Guardar el precio original
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
    // Verificar CSRF token
    const csrfToken = request.headers.get('x-csrf-token');
    if (!csrfToken) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Token CSRF no proporcionado",
        }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      )
    }
    
    const body = await request.json()
    
    // Validar datos con Zod
    const validationResult = await reservationUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Datos de actualización inválidos",
          errors: validationResult.error.format(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      )
    }
    
    const { reservationId, status } = body

    // Obtener la reserva actual antes de actualizarla
    const currentReservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        items: {
          include: {
            device: true
          }
        }
      }
    });

    if (!currentReservation) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No se encontró la reserva especificada"
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Preparar los datos para la actualización
    const updateData = { status };
    
    // Si estamos cancelando, añadir el motivo de cancelación
    if (status === "canceled" && body.cancellationReason) {
      updateData.cancellationReason = body.cancellationReason;
    }

    // Actualizar la reserva
    const updatedReservation = await prisma.reservation.update({
      where: { id: reservationId },
      data: updateData,
      include: {
        items: {
          include: {
            device: true
          }
        }
      }
    });

    // Si estamos cancelando, devolver los productos al inventario
    if (status === "canceled") {
      // Procesar cada item para actualizar el inventario
      for (const item of currentReservation.items) {
        await prisma.device.update({
          where: { id: item.deviceId },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        });
      }
    }

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

