import { PrismaClient, FieldType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando datos iniciales de canchas sintéticas...');

  // Limpiar registros existentes opcionalmente
  await prisma.reservation.deleteMany({});
  await prisma.field.deleteMany({});

  const fields = await Promise.all([
    prisma.field.create({
      data: {
        id: 'cancha-5a',
        name: 'Cancha 1 - La Bombonera',
        type: FieldType.FUTBOL_5,
        pricePerHour: 100000,
        depositPercentage: 50,
        image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80',
        dimensions: '20m x 30m',
        grassType: 'Sintética Monofilamento 50mm'
      }
    }),
    prisma.field.create({
      data: {
        id: 'cancha-5b',
        name: 'Cancha 2 - Maracaná',
        type: FieldType.FUTBOL_5,
        pricePerHour: 110000,
        depositPercentage: 50,
        image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=800&q=80',
        dimensions: '22m x 32m',
        grassType: 'Sintética FIFA Quality Pro'
      }
    }),
    prisma.field.create({
      data: {
        id: 'cancha-7a',
        name: 'Cancha 3 - Camp Nou',
        type: FieldType.FUTBOL_7,
        pricePerHour: 160000,
        depositPercentage: 50,
        image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=800&q=80',
        dimensions: '35m x 55m',
        grassType: 'Sintética Monofilamento Premium 60mm'
      }
    }),
    prisma.field.create({
      data: {
        id: 'cancha-11a',
        name: 'Cancha 4 - Santiago Bernabéu',
        type: FieldType.FUTBOL_11,
        pricePerHour: 260000,
        depositPercentage: 50,
        image: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=800&q=80',
        dimensions: '60m x 90m',
        grassType: 'Sintética Híbrida Profesional'
      }
    })
  ]);

  console.log(`✅ ${fields.length} canchas creadas exitosamente en la base de datos.`);
}

main()
  .catch((e) => {
    console.error('❌ Error al sembrar datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
