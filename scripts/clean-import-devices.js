import { PrismaClient } from "@prisma/client";
import { readFileSync } from "fs";
import path from "path";

const prisma = new PrismaClient();

async function cleanAndImportDevices() {
  try {
    console.log("Eliminando todos los dispositivos existentes...");
    
    // Eliminar todos los dispositivos existentes
    const deleteResult = await prisma.device.deleteMany({});
    console.log(`Dispositivos eliminados: ${deleteResult.count}`);
    
    // Leer el archivo JSON
    const devicesData = JSON.parse(
      readFileSync(
        path.join(process.cwd(), "scripts", "devices.json"),
        "utf-8"
      )
    );

    console.log("Importando nuevos dispositivos...");

    // Crear los dispositivos
    for (const device of devicesData.devices) {
      // Asegurarnos de que stock sea un número
      if (typeof device.stock === "string") {
        device.stock = parseInt(device.stock, 10);
      }
      
      // Asegurarnos de que price sea un número
      if (typeof device.price === "string") {
        device.price = parseFloat(device.price);
      }
      
      await prisma.device.create({
        data: device
      });
      console.log(`Dispositivo creado: ${device.name}`);
    }

    console.log("Importación completada con éxito!");
  } catch (error) {
    console.error("Error durante la importación:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanAndImportDevices();
