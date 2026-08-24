import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, unitPrice, reservationId, customerName, customerEmail } = body;

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    if (!accessToken || accessToken.includes('PON_AQUI_TU_ACCESS_TOKEN')) {
      return NextResponse.json(
        { error: 'Debes configurar tu MERCADOPAGO_ACCESS_TOKEN en las variables de entorno' },
        { status: 400 }
      );
    }

    // Determine public domain (Vercel production URL vs localhost)
    let baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL;
    if (baseUrl && !baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    if (!baseUrl) {
      baseUrl = 'http://localhost:3000';
    }

    const isHttps = baseUrl.startsWith('https://');

    // Build Mercado Pago Preference payload
    const preferencePayload: any = {
      items: [
        {
          id: reservationId || `RES-${Date.now()}`,
          title: title || 'Abono 50% Cancha Sintética',
          quantity: 1,
          currency_id: 'COP',
          unit_price: Number(unitPrice),
        },
      ],
      payer: {
        name: customerName || 'Cliente SintéticaPay',
        email: customerEmail || 'cliente@sinteticapay.com',
      },
      external_reference: reservationId || `RES-${Date.now()}`,
      back_urls: {
        success: baseUrl,
        failure: baseUrl,
        pending: baseUrl,
      },
    };

    // Mercado Pago requires HTTPS for auto_return: 'approved'
    if (isHttps) {
      preferencePayload.auto_return = 'approved';
    }

    // Official Mercado Pago REST API Endpoint
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferencePayload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error de Mercado Pago API:', errorData);
      return NextResponse.json(
        { error: errorData.message || 'Error al comunicarse con Mercado Pago' },
        { status: response.status }
      );
    }

    const preferenceData = await response.json();
    return NextResponse.json({
      id: preferenceData.id,
      init_point: preferenceData.init_point,
      sandbox_init_point: preferenceData.sandbox_init_point,
    });
  } catch (error: any) {
    console.error('Error al crear preferencia de Mercado Pago:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor procesando preferencia de pago' },
      { status: 500 }
    );
  }
}
