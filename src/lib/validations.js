import { z } from 'zod';

// Esquema para validar los datos de reserva
export const reservationSchema = z.object({
  customerName: z.string().min(3, {
    message: "El nombre debe tener al menos 3 caracteres"
  }),
  customerEmail: z.string().email({
    message: "Debe proporcionar un email válido"
  }),
  customerPhone: z.string().min(7, {
    message: "El número de teléfono debe tener al menos 7 dígitos"
  }),
  comments: z.string().optional().nullable(),
  items: z.array(z.object({
    deviceId: z.string(),
    quantity: z.number().int().positive({
      message: "La cantidad debe ser un número positivo"
    }),
    price: z.number().positive({
      message: "El precio debe ser un valor positivo"
    }),
    originalPrice: z.number().positive({
      message: "El precio original debe ser un valor positivo"
    }).optional(),
    device: z.object({
      id: z.string(),
      name: z.string(),
      price: z.number()
    }).optional()
  })).nonempty({
    message: "Debe incluir al menos un producto en la reserva"
  })
});

// Esquema para validar actualizaciones de estado de reserva
export const reservationUpdateSchema = z.object({
  reservationId: z.string(),
  status: z.enum(["pending", "completed", "canceled"], {
    message: "El estado debe ser pending, completed o canceled"
  }),
  cancellationReason: z.string().optional().nullable()
});

// Función para validar datos
export async function validateData(schema, data) {
  try {
    return schema.parse(data);
  } catch (error) {
    return { error: error.flatten() };
  }
}
