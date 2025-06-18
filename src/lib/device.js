import { PrismaClient } from "@prisma/client";

/**
 * @typedef {Object} Device
 * @property {string} id - ID único del dispositivo
 * @property {string} name - Nombre del dispositivo
 * @property {string} brand - Marca del dispositivo
 * @property {string} type - Tipo del dispositivo
 * @property {string} description - Descripción del dispositivo
 * @property {number} price - Precio del dispositivo
 * @property {number} stock - Cantidad en stock
 * @property {string|null} image - URL de la imagen o null
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Fecha de actualización
 */

/**
 * @typedef {Object} FilterOptions
 * @property {string[]} types - Lista de tipos disponibles
 * @property {string[]} brands - Lista de marcas disponibles
 */

const prisma = new PrismaClient();

/**
 * Obtiene todos los dispositivos ordenados por fecha de creación
 * @returns {Promise<Device[]>} Lista de dispositivos con el conteo de ofertas pendientes
 */
export async function getDevices() {
  try {
    const devices = await prisma.device.findMany({
      include: {
        offers: {
          where: {
            status: "pending"
          }
        }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Agregar el contador de ofertas pendientes y la oferta más alta a cada dispositivo
    const processedDevices = devices.map(device => {
      // Aseguramos que offers sea un array
      const offers = Array.isArray(device.offers) ? device.offers : [];
      
      // Encontrar la oferta con el monto más alto (usando offerPrice)
      let highestOffer = 0;
      if (offers.length > 0) {
        // Aseguramos que solo consideramos valores numéricos válidos
        const validAmounts = offers
          .map(offer => offer.offerPrice) // Accedemos a offerPrice, no a amount
          .filter(amount => typeof amount === 'number' && !isNaN(amount));
          
        if (validAmounts.length > 0) {
          highestOffer = Math.max(...validAmounts);
        }
      }
      
      // Crear un nuevo objeto con las propiedades necesarias
      return {
        ...device,
        pendingOffersCount: offers.length || 0,
        highestOfferAmount: highestOffer,
        offers: undefined // Eliminamos el array de ofertas completo para no enviarlo al cliente
      };
    });
    
    // Retornamos los dispositivos con su contador de ofertas pendientes
    return processedDevices;
  } catch (error) {
    console.error("Error fetching devices:", error);
    return [];
  }
}

/**
 * Obtiene un dispositivo por su ID
 * @param {string} id - ID del dispositivo
 * @returns {Promise<Device|null>} El dispositivo o null si no existe
 */
export async function getDeviceById(id) {
  try {
    const device = await prisma.device.findUnique({
      where: { id },
    });

    return device;
  } catch (error) {
    console.error(`Error fetching device with id ${id}:`, error);
    return null;
  }
}

/**
 * Obtiene las opciones de filtro disponibles
 * @returns {Promise<FilterOptions>} Opciones de filtro (tipos y marcas)
 */
export async function getFilterOptions() {
  try {
    console.log('Iniciando búsqueda de filtros...');
    
    // Obtener tipos únicos
    const types = await prisma.device.findMany({
      select: {
        type: true,
      },
      distinct: ['type'],
      where: {
        type: {
          not: ''
        },
      },
      orderBy: {
        type: 'asc',
      },
    });

    // Obtener marcas únicas
    const brands = await prisma.device.findMany({
      select: {
        brand: true,
      },
      distinct: ['brand'],
      where: {
        brand: {
          not: ''
        },
      },
      orderBy: {
        brand: 'asc',
      },
    });

    // Extraer los valores de los objetos y filtrar valores vacíos
    const typeValues = types
      .map(t => t.type)
      .filter(type => Boolean(type && type.trim() !== ''));

    const brandValues = brands
      .map(b => b.brand)
      .filter(brand => Boolean(brand && brand.trim() !== ''));

    console.log('Tipos encontrados:', typeValues);
    console.log('Marcas encontradas:', brandValues);

    if (!typeValues.length || !brandValues.length) {
      console.warn('Advertencia: No se encontraron tipos o marcas en la base de datos');
    }

    return {
      types: typeValues,
      brands: brandValues,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error detallado al obtener opciones de filtro:", error);
    throw new Error(`Error al obtener opciones de filtro: ${errorMessage}`);
  }
}

// Update device stock
/**
 * Actualiza el stock de un dispositivo
 * @param {string} deviceId - ID del dispositivo
 * @param {number} quantity - Cantidad a reducir del stock
 * @returns {Promise<Device>} El dispositivo actualizado
 */
export async function updateDeviceStock(deviceId, quantity) {
  try {
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new Error(`Device with ID ${deviceId} not found`);
    }

    if (device.stock < quantity) {
      throw new Error(`Not enough stock for device ${device.name}`);
    }

    // Update the stock
    const updatedDevice = await prisma.device.update({
      where: { id: deviceId },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    });

    return updatedDevice;
  } catch (error) {
    console.error(`Error updating stock for device ${deviceId}:`, error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`Unknown error updating stock: ${String(error)}`);
    }
  }
}
