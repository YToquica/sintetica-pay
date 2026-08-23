import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { MOCK_FIELDS } from '@/lib/store';

export async function GET() {
  try {
    const fields = await prisma.field.findMany({
      orderBy: { pricePerHour: 'asc' },
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
