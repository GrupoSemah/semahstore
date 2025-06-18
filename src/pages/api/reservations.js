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

    // Comprobar si estamos recibiendo la estructura antigua o la nueva
    // (estructura antigua tiene customer anidado, nueva tiene customerName directo)
    let reservationData;
    
    // Si los campos ya vienen aplanados del cliente
    if (body.customerName && body.customerEmail && body.items) {
      reservationData = {
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        customerPhone: body.customerPhone,
        comments: body.comments || null,
        items: body.items.map(item => ({
          deviceId: item.deviceId,
          quantity: Number(item.quantity),
          price: Number(item.price || 0), // Asegurarnos que no sea null/undefined
          originalPrice: Number(item.originalPrice || item.price || 0)
        }))
      };
    } 
    // Estructura antigua con customer anidado
    else if (body.customer && body.items) {
      const { customer, items } = body;
      
      reservationData = {
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        comments: body.comments || customer.comments || null,
        items: items.map(item => ({
          deviceId: item.id || item.deviceId,
          quantity: Number(item.quantity),
          price: parseFloat(item.price || 0) || 0,
          originalPrice: parseFloat(item.originalPrice || item.price || 0) || 0
        }))
      };
    }
    // Estructura no reconocida
    else {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Estructura de datos no reconocida",
          receivedStructure: Object.keys(body)
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Identificar si hay items con ofertas (precios diferentes al original)
    const hasOffersItems = reservationData.items.some(
      item => item.price !== item.originalPrice
    );

    // Validar datos con Zod
    const validationResult = await reservationSchema.safeParse(reservationData);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Datos de reserva inválidos",
          errors: validationResult.error.format(),
          dataReceived: reservationData // Incluir los datos recibidos para depuración
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
      for (const item of reservationData.items) {
        const device = await prisma.device.findUnique({
          where: { id: item.deviceId },
        })

        if (!device) {
          throw new Error(`Dispositivo no encontrado: ${item.deviceId}`)
        }

        if (device.stock < item.quantity) {
          throw new Error(
            `Stock insuficiente para el dispositivo ${device.name}. Disponible: ${device.stock}, Solicitado: ${item.quantity}`,
          )
        }
      }

      // Separar items de precio de lista y con oferta
      const listPriceItems = reservationData.items.filter(item => item.price === item.originalPrice);
      const offerItems = reservationData.items.filter(item => item.price !== item.originalPrice);
      
      // Primero, procesamos las posibles ofertas si existen
      if (offerItems.length > 0) {
        // Crear ofertas en la base de datos
        for (const item of offerItems) {
          await prisma.offer.create({
            data: {
              customerName: reservationData.customerName,
              customerEmail: reservationData.customerEmail,
              customerPhone: reservationData.customerPhone,
              comments: reservationData.comments || "",
              offerPrice: item.price,
              originalPrice: item.originalPrice,
              quantity: item.quantity,
              device: {
                connect: { id: item.deviceId } // Conectar con el dispositivo existente
              }
            }
          });
        }
      }
      
      // Si hay items de precio de lista, crear la reserva directamente
      let reservation = null;
      if (listPriceItems.length > 0) {
        // Calcular el total con valores numéricos seguros
        const listPriceTotal = listPriceItems.reduce((sum, item) => {
          const price = parseFloat(item.price || 0) || 0;
          const quantity = parseInt(item.quantity || 1) || 1;
          return sum + (price * quantity);
        }, 0);
        
        // Crear la reserva y actualizar stock en una transacción
        reservation = await prisma.$transaction(async (tx) => {
          // Crear la reserva
          const newReservation = await tx.reservation.create({
            data: {
              code: reservationCode,
              customerName: reservationData.customerName,
              customerEmail: reservationData.customerEmail,
              customerPhone: reservationData.customerPhone,
              comments: reservationData.comments || "",
              total: listPriceTotal,
              items: {
                create: listPriceItems.map((item) => ({
                  quantity: item.quantity,
                  price: item.price,
                  originalPrice: item.price, // Para items de precio de lista son iguales
                  deviceId: item.deviceId,
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

          // Actualizar stock solo para los items de precio de lista
          for (const item of listPriceItems) {
            await tx.device.update({
              where: { id: item.deviceId },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            })
          }

          return newReservation
        })
      }

      // Enviar correo de confirmación solo si hay items de precio de lista
      if (listPriceItems.length > 0) {
        try {
          await sendReservationEmail({
            customer: {
              name: reservationData.customerName,
              email: reservationData.customerEmail,
              phone: reservationData.customerPhone,
              comments: reservationData.comments
            },
            items: listPriceItems.map((item) => ({
              ...item,
              total: item.price * item.quantity,
            })),
            total: listPriceItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            reservationCode,
          })
        } catch (emailError) {
          console.error("Error al enviar el correo:", emailError)
          // Continuamos aunque falle el envío del correo
        }
      }
      
      // Preparar respuesta con información de ofertas si existen
      const hasOffers = offerItems.length > 0;

      return new Response(
        JSON.stringify({
          success: true,
          reservationCode: listPriceItems.length > 0 ? reservationCode : null,
          hasOffers,
          offerCount: offerItems.length,
          message: hasOffers 
            ? (listPriceItems.length > 0 
              ? "Reserva creada exitosamente y ofertas enviadas para revisión" 
              : "Ofertas enviadas para revisión del administrador")
            : "Reserva creada exitosamente",
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
    // Error ya manejado en la respuesta
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Error al procesar la reserva",
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

