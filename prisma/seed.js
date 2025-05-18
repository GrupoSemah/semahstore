import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Clean existing data
  await prisma.reservationItem.deleteMany({})
  await prisma.reservation.deleteMany({})
  await prisma.device.deleteMany({})

  console.log("Seeding database...")

  // Create devices
  const devices = await Promise.all([
    // Cameras
    prisma.device.create({
      data: {
        name: "Canon EOS R5",
        description: "Cámara mirrorless profesional con grabación de video 8K",
        price: 3899.99,
        brand: "Canon",
        type: "Cámara",
        image: "https://example.com/images/canon-r5.jpg",
        stock: 5,
      },
    }),
    prisma.device.create({
      data: {
        name: "Sony Alpha a7 III",
        description: "Cámara mirrorless full-frame con excelente rendimiento en condiciones de poca luz",
        price: 1999.99,
        brand: "Sony",
        type: "Cámara",
        image: "https://example.com/images/sony-a7iii.jpg",
        stock: 8,
      },
    }),
    prisma.device.create({
      data: {
        name: "Nikon Z6 II",
        description: "Cámara mirrorless versátil para fotografía y video",
        price: 1999.95,
        brand: "Nikon",
        type: "Cámara",
        image: "https://example.com/images/nikon-z6ii.jpg",
        stock: 6,
      },
    }),

    // Lentes
    prisma.device.create({
      data: {
        name: "Canon RF 24-70mm f/2.8L IS USM",
        description: "Lente zoom estándar profesional para cámaras Canon RF",
        price: 2399.99,
        brand: "Canon",
        type: "Lente",
        image: "https://example.com/images/canon-rf-24-70.jpg",
        stock: 4,
      },
    }),
    prisma.device.create({
      data: {
        name: "Sony FE 24-70mm f/2.8 GM",
        description: "Lente zoom G Master para cámaras Sony E-mount",
        price: 2199.99,
        brand: "Sony",
        type: "Lente",
        image: "https://example.com/images/sony-24-70gm.jpg",
        stock: 3,
      },
    }),

    // Iluminación
    prisma.device.create({
      data: {
        name: "Godox AD600Pro",
        description: "Flash estroboscópico potente para exteriores e interiores",
        price: 899.99,
        brand: "Godox",
        type: "Iluminación",
        image: "https://example.com/images/godox-ad600pro.jpg",
        stock: 10,
      },
    }),
    prisma.device.create({
      data: {
        name: "Aputure 120d II",
        description: "Luz LED continua de 120W con temperatura de color de 5500K",
        price: 745.0,
        brand: "Aputure",
        type: "Iluminación",
        image: "https://example.com/images/aputure-120d.jpg",
        stock: 7,
      },
    }),

    // Audio
    prisma.device.create({
      data: {
        name: "Rode VideoMic Pro+",
        description: "Micrófono de escopeta compacto para cámaras DSLR y mirrorless",
        price: 299.0,
        brand: "Rode",
        type: "Audio",
        image: "https://example.com/images/rode-videomicpro.jpg",
        stock: 12,
      },
    }),
    prisma.device.create({
      data: {
        name: "Zoom H6",
        description: "Grabadora de audio portátil de 6 canales",
        price: 349.99,
        brand: "Zoom",
        type: "Audio",
        image: "https://example.com/images/zoom-h6.jpg",
        stock: 5,
      },
    }),

    // Trípodes
    prisma.device.create({
      data: {
        name: "Manfrotto MT055XPRO3",
        description: "Trípode profesional de aluminio con columna central horizontal",
        price: 249.99,
        brand: "Manfrotto",
        type: "Trípode",
        image: "https://example.com/images/manfrotto-mt055.jpg",
        stock: 8,
      },
    }),
  ])

  console.log(`Created ${devices.length} devices`)

}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

