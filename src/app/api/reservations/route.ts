import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ReservationStatus } from '@prisma/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  try {
    const reservations = await prisma.reservation.findMany({
      where: date ? { date } : undefined,
      include: { field: true },
      orderBy: { startTime: 'asc' },
    });
    return NextResponse.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return NextResponse.json({ error: 'Error al consultar reservas' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      fieldId,
      date,
      startTime,
      endTime,
      customerName,
      customerPhone,
      customerEmail,
      paymentMethodDeposit,
    } = body;

    // Obtener la cancha para calcular abono 50%
    const field = await prisma.field.findUnique({
      where: { id: fieldId },
    });

    if (!field) {
      return NextResponse.json({ error: 'Cancha no encontrada' }, { status: 404 });
    }

    // Verificar traslape / doble reserva
    const existing = await prisma.reservation.findFirst({
      where: {
        fieldId,
        date,
        startTime,
        status: { not: ReservationStatus.CANCELADA },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'El horario seleccionado ya se encuentra apartado.' },
        { status: 409 }
      );
    }

    const depositAmount = (field.pricePerHour * field.depositPercentage) / 100;
    const remainingAmount = field.pricePerHour - depositAmount;
    const resId = `RES-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReservation = await prisma.reservation.create({
      data: {
        id: resId,
        fieldId: field.id,
        date,
        startTime,
        endTime,
        customerName,
        customerPhone,
        customerEmail,
        totalPrice: field.pricePerHour,
        depositAmount,
        remainingAmount,
        status: ReservationStatus.ABONADA_50,
        paymentMethodDeposit,
        qrCodeValue: `SUPABASE-RES-${resId}-${fieldId}-${date}-${startTime}`,
      },
      include: { field: true },
    });

    return NextResponse.json(newReservation, { status: 201 });
  } catch (error: any) {
    console.error('Error creating reservation:', error);
    if (error?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Ya existe una reserva para este horario.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Error al procesar la reserva' }, { status: 500 });
  }
}
