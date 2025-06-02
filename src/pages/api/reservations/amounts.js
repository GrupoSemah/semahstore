export const prerender = false

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET() {
  try {
    // 1. Obtener el monto publicado (suma del precio * stock de todos los productos)
    const devices = await prisma.device.findMany({
      select: {
        price: true,
        stock: true
      }
    });

    const publishedAmount = devices.reduce((total, device) => {
      return total + (device.price * device.stock);
    }, 0);

    // 2. Obtener monto ofertado (suma de ofertas en reservas pendientes)
    const pendingReservations = await prisma.reservation.findMany({
      where: { status: 'pending' },
      include: {
        items: {
          select: {
            price: true,
            quantity: true,
            originalPrice: true
          }
        }
      }
    });

    const offeredAmount = pendingReservations.reduce((total, reservation) => {
      return total + reservation.items.reduce((reservationTotal, item) => {
        return reservationTotal + (item.price * item.quantity);
      }, 0);
    }, 0);

    // 3. Obtener monto pagado (suma de reservas completadas)
    const completedReservations = await prisma.reservation.findMany({
      where: { status: 'completed' },
      select: { total: true }
    });

    const paidAmount = completedReservations.reduce((total, reservation) => {
      return total + reservation.total;
    }, 0);

    return new Response(JSON.stringify({
      publishedAmount,
      offeredAmount,
      paidAmount
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error al obtener montos:", error);
    return new Response(
      JSON.stringify({
        error: "Error al obtener los montos",
        message: error.message
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } finally {
    await prisma.$disconnect();
  }
}
