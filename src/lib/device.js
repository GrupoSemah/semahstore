import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function getDevices() {
  try {
    const devices = await prisma.device.findMany({
      orderBy: {
        createdAt: "desc",
      },
    })

    return devices
  } catch (error) {
    console.error("Error fetching devices:", error)
    return []
  }
}

export async function getDeviceById(id) {
  try {
    const device = await prisma.device.findUnique({
      where: { id },
    })

    return device
  } catch (error) {
    console.error(`Error fetching device with id ${id}:`, error)
    return null
  }
}

export async function getFilterOptions() {
  try {
    console.log('Iniciando búsqueda de filtros...')
    
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
    })

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
    })

    // Extraer los valores de los objetos y filtrar valores vacíos
    const typeValues = types
      .map(t => t.type)
      .filter(type => type && type.trim() !== '')

    const brandValues = brands
      .map(b => b.brand)
      .filter(brand => brand && brand.trim() !== '')

    console.log('Tipos encontrados:', typeValues)
    console.log('Marcas encontradas:', brandValues)

    if (!typeValues.length || !brandValues.length) {
      console.warn('Advertencia: No se encontraron tipos o marcas en la base de datos')
    }

    return {
      types: typeValues,
      brands: brandValues,
    }
  } catch (error) {
    console.error("Error detallado al obtener opciones de filtro:", error)
    throw new Error(`Error al obtener opciones de filtro: ${error.message}`)
  }
}

// Update device stock
export async function updateDeviceStock(deviceId, quantity) {
  try {
    const device = await prisma.device.findUnique({
      where: { id: deviceId },
    })

    if (!device) {
      throw new Error(`Device with ID ${deviceId} not found`)
    }

    if (device.stock < quantity) {
      throw new Error(`Not enough stock for device ${device.name}`)
    }

    // Update the stock
    const updatedDevice = await prisma.device.update({
      where: { id: deviceId },
      data: {
        stock: {
          decrement: quantity,
        },
      },
    })

    return updatedDevice
  } catch (error) {
    console.error(`Error updating stock for device ${deviceId}:`, error)
    throw error
  }
}
