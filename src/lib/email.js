import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY no está configurada")
    return
  }

  try {
    await resend.emails.send({
      from: 'SEMAH Store <onboarding@resend.dev>',
      to,
      subject,
      html,
    })
    console.log(`Correo enviado exitosamente a ${to}`)
  } catch (error) {
    console.error('Error al enviar el correo:', error)
    throw error
  }
}

export async function sendReservationEmail({ customer, items, total, reservationCode }) {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY no está configurada")
    return
  }

  // Correos de administradores (configurables)
  const adminEmails = [
    'it@semah.com',
    'cferrer@semah.com',
    'mmora@semah.com',
    process.env.ADMIN_EMAIL // Mantiene compatibilidad con la configuración existente
  ]

  // Combinamos el correo del cliente con los correos de administradores
  const recipients = [
    customer.email,
    ...adminEmails
  ].filter(Boolean) // Elimina valores nulos o undefined

  if (!recipients.length) {
    console.error("No hay destinatarios válidos para el correo")
    return
  }

  const itemsTable = `
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
      <thead>
        <tr style="background-color: #f3f4f6;">
          <th style="padding: 10px; text-align: left; border: 1px solid #e5e7eb;">Producto</th>
          <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">Precio</th>
          <th style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">Cantidad</th>
          <th style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${items.map(item => `
          <tr>
            <td style="padding: 10px; border: 1px solid #e5e7eb;">${item.name || 'Producto'}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">$${item.price.toLocaleString()}</td>
            <td style="padding: 10px; text-align: center; border: 1px solid #e5e7eb;">${item.quantity}</td>
            <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">$${(item.price * item.quantity).toLocaleString()}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr style="font-weight: bold;">
          <td colspan="3" style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">Total:</td>
          <td style="padding: 10px; text-align: right; border: 1px solid #e5e7eb;">$${total.toLocaleString()}</td>
        </tr>
      </tfoot>
    </table>
  `

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #FF6B1E; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">Confirmación de Reserva</h1>
      </div>
      
      <div style="padding: 20px;">
        <div style="background-color: #f9fafb; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="margin-top: 0; color: #FF6B1E;">Código de Reserva: ${reservationCode}</h2>
          <p><strong>Cliente:</strong> ${customer.name}</p>
          <p><strong>Email:</strong> ${customer.email}</p>
          <p><strong>Teléfono:</strong> ${customer.phone}</p>
          ${customer.comments ? `<p><strong>Comentarios:</strong> ${customer.comments}</p>` : ''}
        </div>
        
        <h2 style="color: #FF6B1E;">Detalles de la Reserva</h2>
        ${itemsTable}
        
        <div style="text-align: center; margin-top: 30px; padding: 20px; background-color: #f9fafb; border-radius: 5px;">
          <p style="margin: 0; color: #4b5563;">
            Gracias por tu reserva. Si tienes alguna pregunta, no dudes en contactarnos.
          </p>
        </div>
      </div>
      
      <div style="background-color: #FF6B1E; color: white; text-align: center; padding: 20px; margin-top: 20px;">
        <p style="margin: 0;">© ${new Date().getFullYear()} SEMAH Group</p>
      </div>
    </div>
  `

  try {
    for (const recipient of recipients) {
      await resend.emails.send({
        from: 'SEMAH Store <onboarding@resend.dev>',
        to: recipient,
        subject: `Confirmación de Reserva #${reservationCode}`,
        html: htmlContent,
      })
      console.log(`Correo enviado exitosamente a ${recipient}`)
    }
  } catch (error) {
    console.error('Error al enviar el correo:', error)
    throw error
  }
}

