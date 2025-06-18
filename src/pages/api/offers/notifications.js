import { PrismaClient } from "@prisma/client"
import { sendEmail } from "../../../lib/email"
import { validateCSRFToken, createCSRFToken } from "@/lib/csrf"

const prisma = new PrismaClient()

/**
 * Endpoints para manejo de notificaciones de ofertas
 */
export default async function handler(req, res) {
  const { method } = req

  switch (method) {
    case "GET":
      return await handleGenerateToken(req, res)
    case "POST":
      return await sendOfferNotification(req, res)
    default:
      res.setHeader("Allow", ["GET", "POST"])
      res.status(405).end(`Method ${method} Not Allowed`)
  }
}

/**
 * Genera y devuelve un token CSRF
 */
async function handleGenerateToken(req, res) {
  const sessionId = req.headers.get('authorization') || 'default_session';
  const token = createCSRFToken(sessionId);
  
  return new Response(
    JSON.stringify({ 
      token,
      success: true 
    }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" }
    }
  );
}

/**
 * Envía notificación por correo al cliente sobre el estado de su oferta
 */
async function sendOfferNotification(req, res) {
  try {
    // Validar CSRF token
    if (!validateCSRFToken(req.headers.get('x-csrf-token'), req.headers.get('authorization'))) {
      return res.status(403).json({ success: false, message: "Token CSRF inválido" })
    }

    const { offerId } = req.body

    if (!offerId) {
      return res.status(400).json({ success: false, message: "ID de oferta requerido" })
    }

    // Obtener detalles de la oferta con el dispositivo relacionado
    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      include: { device: true }
    })

    if (!offer) {
      return res.status(404).json({ success: false, message: "Oferta no encontrada" })
    }

    // Preparar el contenido del correo según el estado de la oferta
    let emailSubject
    let emailContent

    if (offer.status === "accepted") {
      // Buscar la reserva creada a partir de esta oferta
      const reservation = await prisma.reservation.findFirst({
        where: { offers: { some: { id: offerId } } }
      })

      emailSubject = "¡Tu oferta ha sido aceptada! - SEMAH Store"
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF6B1E;">¡Buenas noticias! Tu oferta ha sido aceptada</h2>
          <p>Estimado/a ${offer.customerName},</p>
          <p>Nos complace informarte que tu oferta para el producto <strong>${offer.device.name}</strong> ha sido aceptada.</p>
          <ul style="padding-left: 20px;">
            <li>Producto: ${offer.device.name}</li>
            <li>Precio ofertado: $${offer.offerPrice.toLocaleString()}</li>
            <li>Cantidad: ${offer.quantity}</li>
          </ul>
          <p>Hemos generado una reserva automáticamente para tu producto. ${
            reservation ? `Tu código de reserva es: <strong>${reservation.code}</strong>.` : ''
          }</p>
          <p>Por favor contáctanos para coordinar el pago y la entrega de tu producto.</p>
          <p>Gracias por confiar en SEMAH Store.</p>
        </div>
      `
    } else if (offer.status === "rejected") {
      emailSubject = "Respuesta sobre tu oferta - SEMAH Store"
      emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #FF6B1E;">Respuesta sobre tu oferta</h2>
          <p>Estimado/a ${offer.customerName},</p>
          <p>Lamentamos informarte que no hemos podido aceptar tu oferta para el producto <strong>${offer.device.name}</strong>.</p>
          <ul style="padding-left: 20px;">
            <li>Producto: ${offer.device.name}</li>
            <li>Precio ofertado: $${offer.offerPrice.toLocaleString()}</li>
            <li>Precio de lista: $${offer.originalPrice.toLocaleString()}</li>
            <li>Cantidad: ${offer.quantity}</li>
          </ul>
          ${offer.rejectionReason ? `<p><strong>Motivo:</strong> ${offer.rejectionReason}</p>` : ''}
          <p>Te invitamos a visitar nuestra tienda para conocer otras opciones o hacer una nueva oferta.</p>
          <p>Gracias por tu interés en SEMAH Store.</p>
        </div>
      `
    } else {
      return res.status(400).json({ 
        success: false, 
        message: "Solo se pueden enviar notificaciones de ofertas aceptadas o rechazadas" 
      })
    }

    // Enviar correo electrónico
    await sendEmail({
      to: offer.customerEmail,
      subject: emailSubject,
      html: emailContent
    })

    // Marcar la oferta como notificada (opcional, podemos agregar un campo para esto en el futuro)
    return res.status(200).json({ 
      success: true, 
      message: "Notificación enviada correctamente al cliente" 
    })
  } catch (error) {
    console.error("Error al enviar notificación:", error)
    return res.status(500).json({ 
      success: false, 
      message: "Error al enviar la notificación",
      error: error.message 
    })
  }
}
