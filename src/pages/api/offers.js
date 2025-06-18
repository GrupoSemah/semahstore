export const prerender = false

import { PrismaClient } from "@prisma/client"
import { nanoid } from "nanoid"
import { sendReservationEmail } from "@/lib/email"
import { sanitizeObject } from "@/lib/sanitize"

const prisma = new PrismaClient()

export async function GET() {
  try {
    const offers = await prisma.offer.findMany({
      include: {
        device: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return new Response(JSON.stringify(offers), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    })
  } catch (error) {
    console.error("Error al obtener ofertas:", error)
    return new Response(
      JSON.stringify({
        error: "Error al obtener las ofertas",
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

    const { customer, items } = body;

    // Verificar stock disponible para todas las ofertas
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

    // Crear las ofertas en la base de datos
    const createdOffers = [];
    
    for (const item of items) {
      // Solo creamos oferta si el precio es diferente al precio de lista
      if (item.offerPrice !== null && item.offerPrice !== item.price) {
        const offer = await prisma.offer.create({
          data: {
            customerName: customer.name,
            customerEmail: customer.email,
            customerPhone: customer.phone,
            comments: customer.comments || "",
            offerPrice: item.offerPrice,
            originalPrice: item.price,
            quantity: item.quantity,
            deviceId: item.id,
          },
          include: {
            device: true,
          },
        });
        
        createdOffers.push(offer);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        offers: createdOffers,
        message: "Ofertas creadas exitosamente",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  } catch (error) {
    console.error("Error completo:", error)
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Error al procesar las ofertas",
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

// Para procesar ofertas (aceptar o rechazar)
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
    const { offerId, action, rejectionReason } = body
    
    // Obtener la oferta
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        device: true
      }
    });

    if (!offer) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "No se encontró la oferta especificada"
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Rechazar la oferta
    if (action === "reject") {
      const updatedOffer = await prisma.offer.update({
        where: { id: offerId },
        data: {
          status: "rejected",
          rejectionReason: rejectionReason || "Oferta rechazada por administrador"
        },
        include: {
          device: true
        }
      });

      return new Response(
        JSON.stringify({
          success: true,
          offer: updatedOffer,
          message: "Oferta rechazada correctamente"
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    // Aceptar la oferta
    if (action === "accept") {
      // Verificar stock actual
      const device = await prisma.device.findUnique({
        where: { id: offer.deviceId }
      });
      
      if (!device) {
        return new Response(
          JSON.stringify({
            success: false,
            message: "El dispositivo ya no existe en el inventario"
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      
      if (device.stock < offer.quantity) {
        return new Response(
          JSON.stringify({
            success: false,
            message: `Stock insuficiente. Disponible: ${device.stock}, Requerido: ${offer.quantity}`
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      
      // Generar código de reserva único
      const reservationCode = nanoid(10).toUpperCase()
      
      // Crear reserva y actualizar ofertas en una transacción
      const { updatedOffer, newReservation, cancelledOffers } = await prisma.$transaction(async (tx) => {
        // Actualizar estado de la oferta
        const updatedOffer = await tx.offer.update({
          where: { id: offerId },
          data: {
            status: "accepted"
          },
          include: {
            device: true
          }
        });
        
        // Cancelar todas las demás ofertas pendientes para el mismo producto
        const cancelledOffers = await tx.offer.updateMany({
          where: {
            deviceId: offer.deviceId,
            status: "pending",
            id: { not: offerId }
          },
          data: {
            status: "cancelled",
            rejectionReason: "Otra oferta fue aceptada para este producto"
          }
        });
        
        // Crear la reserva
        const newReservation = await tx.reservation.create({
          data: {
            code: reservationCode,
            customerName: offer.customerName,
            customerEmail: offer.customerEmail,
            customerPhone: offer.customerPhone,
            comments: offer.comments || "",
            total: offer.offerPrice * offer.quantity,
            offerId: offer.id,
            items: {
              create: [{
                quantity: offer.quantity,
                price: offer.offerPrice,
                originalPrice: offer.originalPrice,
                deviceId: offer.deviceId
              }],
            },
          },
          include: {
            items: {
              include: {
                device: true,
              },
            },
          },
        });
        
        // Actualizar stock
        await tx.device.update({
          where: { id: offer.deviceId },
          data: {
            stock: {
              decrement: offer.quantity,
            },
          },
        });
        
        return { updatedOffer, newReservation, cancelledOffers };
      });
      
      // Enviar correo de confirmación
      try {
        await sendReservationEmail({
          customer: {
            name: offer.customerName,
            email: offer.customerEmail,
            phone: offer.customerPhone
          },
          items: [{
            name: offer.device.name,
            price: offer.offerPrice,
            quantity: offer.quantity,
            total: offer.offerPrice * offer.quantity
          }],
          total: offer.offerPrice * offer.quantity,
          reservationCode,
          isOffer: true
        })
      } catch (emailError) {
        console.error("Error al enviar el correo:", emailError)
        // Continuamos aunque falle el envío del correo
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          offer: updatedOffer,
          reservation: newReservation,
          reservationCode,
          cancelledOffersCount: cancelledOffers?.count || 0,
          message: "Oferta aceptada y reserva creada correctamente"
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        message: "Acción no válida. Debe ser 'accept' o 'reject'"
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error procesando oferta:", error)
    return new Response(
      JSON.stringify({
        success: false,
        message: error.message || "Error al procesar la oferta"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}
