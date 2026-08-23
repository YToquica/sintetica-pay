import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ReservationStatus } from '@prisma/client';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { paymentMethodRemaining, status } = body;

    const updated = await prisma.reservation.update({
      where: { id },
      data: {
        status: status || ReservationStatus.COMPLETADA_100,
        paymentMethodRemaining,
        remainingAmount: status === ReservationStatus.COMPLETADA_100 ? 0 : undefined,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating reservation payment:', error);
    return NextResponse.json({ error: 'Error al actualizar el pago en sitio' }, { status: 500 });
  }
}
