import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { FieldType } from '@prisma/client';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name,
      type,
      pricePerHour,
      depositPercentage,
      image,
      dimensions,
      grassType,
    } = body;

    let enumType: FieldType = FieldType.FUTBOL_5;
    if (type === 'Fútbol 7' || type === 'FUTBOL_7') enumType = FieldType.FUTBOL_7;
    if (type === 'Fútbol 11' || type === 'FUTBOL_11') enumType = FieldType.FUTBOL_11;

    const updatedField = await prisma.field.update({
      where: { id },
      data: {
        name,
        type: enumType,
        pricePerHour: pricePerHour ? parseFloat(pricePerHour) : undefined,
        depositPercentage: depositPercentage ? parseFloat(depositPercentage) : undefined,
        image,
        dimensions,
        grassType,
      },
    });

    return NextResponse.json(updatedField);
  } catch (error) {
    console.error('Error actualizando cancha:', error);
    return NextResponse.json({ error: 'Error al actualizar la cancha' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.field.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Cancha eliminada exitosamente' });
  } catch (error) {
    console.error('Error eliminando cancha:', error);
    return NextResponse.json({ error: 'Error al eliminar la cancha' }, { status: 500 });
  }
}
