export interface Field {
  id: string;
  name: string;
  type: 'Fútbol 5' | 'Fútbol 7' | 'Fútbol 11';
  pricePerHour: number;
  depositPercentage: number; // e.g., 50
  image: string;
  dimensions: string;
  grassType: string;
  features: string[];
}

export type PaymentMethodDeposit = 'Nequi' | 'PSE' | 'Tarjeta de Crédito' | 'Mercado Pago';
export type PaymentMethodRemaining = 'Efectivo en Cancha' | 'Datáfono en Sitio' | 'Transferencia en Sitio';

export type ReservationStatus = 'ABONADA_50' | 'COMPLETADA_100' | 'CANCELADA';

export interface Reservation {
  id: string;
  fieldId: string;
  fieldName: string;
  fieldType: string;
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "18:00"
  endTime: string; // e.g. "19:00"
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  totalPrice: number;
  depositAmount: number;
  remainingAmount: number;
  status: ReservationStatus;
  paymentMethodDeposit: PaymentMethodDeposit;
  paymentMethodRemaining?: PaymentMethodRemaining;
  createdAt: string;
  qrCodeValue: string;
}
