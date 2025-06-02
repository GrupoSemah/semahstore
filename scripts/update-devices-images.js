import { PrismaClient } from "@prisma/client"
import { readFileSync } from "fs"
import path from "path"

const prisma = new PrismaClient()

async function updateDevicesImagesAndTypes() {
  try {
    // Leer el archivo JSON
    const devicesData = JSON.parse(
      readFileSync(
        path.join(process.cwd(), "scripts", "devices.json"),
        "utf-8"
      )
    )

    console.log("Actualizando imágenes y tipos de dispositivos...")
    let createdCount = 0;
    let updatedCount = 0;

    // Para cada dispositivo, verificar si existe y actualizar la imagen
    for (const device of devicesData.devices) {
      // Buscar si existe un dispositivo con el mismo nombre
      const existingDevice = await prisma.device.findFirst({
        where: {
          name: device.name
        }
      });

      if (existingDevice) {
        // Si existe, actualizar la URL de la imagen y el tipo
        await prisma.device.update({
          where: {
            id: existingDevice.id
          },
          data: {
            image: device.image,
            type: device.type
          }
        });
        console.log(`Imagen y tipo actualizados para dispositivo: ${device.name}`);
        updatedCount++;
      } else {
        // Si no existe, crear el dispositivo completo
        await prisma.device.create({
          data: device
        });
        console.log(`Dispositivo creado: ${device.name}`);
        createdCount++;
      }
    }

    console.log("Proceso completado con éxito!");
    console.log(`Dispositivos creados: ${createdCount}`);
    console.log(`Dispositivos actualizados (imagen y tipo): ${updatedCount}`);
  } catch (error) {
    console.error("Error durante la actualización:", error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDevicesImagesAndTypes();
