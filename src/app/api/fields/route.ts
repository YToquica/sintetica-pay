import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MOCK_FIELDS } from '@/lib/store';
import { FieldType } from '@prisma/client';

export async function GET() {
  try {
    const fields = await prisma.field.findMany({
      orderBy: { createdAt: 'desc' },
    });
    
    if (fields.length === 0) {
      return NextResponse.json(MOCK_FIELDS);
    }

    return NextResponse.json(fields);
  } catch (error) {
    console.warn('Fallback a MOCK_FIELDS por error de conexión temporal:', error);
    return NextResponse.json(MOCK_FIELDS);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      type,
      pricePerHour,
      depositPercentage = 50,
      image,
      dimensions,
      grassType,
      ownerId = 'system',
    } = body;

    if (!name || !pricePerHour || !dimensions || !grassType) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // Convert string type enum if needed
    let enumType: FieldType = FieldType.FUTBOL_5;
    if (type === 'Fútbol 7' || type === 'FUTBOL_7') enumType = FieldType.FUTBOL_7;
    if (type === 'Fútbol 11' || type === 'FUTBOL_11') enumType = FieldType.FUTBOL_11;

    const newField = await prisma.field.create({
      data: {
        name,
        type: enumType,
        pricePerHour: parseFloat(pricePerHour),
        depositPercentage: parseFloat(depositPercentage),
        image: image || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80',
        dimensions,
        grassType,
        ownerId,
      },
    });

    return NextResponse.json(newField, { status: 201 });
  } catch (error) {
    console.error('Error creando cancha:', error);
    return NextResponse.json({ error: 'Error al crear la cancha en Supabase' }, { status: 500 });
  }
}
