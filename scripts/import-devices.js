import { PrismaClient } from "@prisma/client"
import { readFileSync } from "fs"
import path from "path"

const prisma = new PrismaClient()

async function importDevices() {
  try {
    // Leer el archivo JSON
    const devicesData = JSON.parse(
      readFileSync(
        path.join(process.cwd(), "scripts", "devices.json"),
        "utf-8"
      )
    )

    console.log("Importando dispositivos...")

    // Crear los dispositivos
    for (const device of devicesData.devices) {
      await prisma.device.create({
        data: device
      })
      console.log(`Dispositivo creado: ${device.name}`)
    }

    console.log("Importación completada con éxito!")
  } catch (error) {
    console.error("Error durante la importación:", error)
  } finally {
    await prisma.$disconnect()
  }
}

importDevices() 