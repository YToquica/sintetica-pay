import { Field, Reservation, PaymentMethodRemaining } from './types';

export const MOCK_FIELDS: Field[] = [
  {
    id: 'cancha-5a',
    name: 'Cancha 1 - La Bombonera',
    type: 'Fútbol 5',
    pricePerHour: 100000,
    depositPercentage: 50,
    image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80',
    dimensions: '20m x 30m',
    grassType: 'Sintética Monofilamento 50mm',
    features: ['Techo cubierta total', 'Iluminación LED Profesional', 'Banquillos de suplentes', 'Gradería para 40 personas']
  },
  {
    id: 'cancha-5b',
    name: 'Cancha 2 - Maracaná',
    type: 'Fútbol 5',
    pricePerHour: 110000,
    depositPercentage: 50,
    image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=800&q=80',
    dimensions: '22m x 32m',
    grassType: 'Sintética FIFA Quality Pro',
    features: ['Techo cubierta total', 'Iluminación LED Pro', 'Sonido ambiente', 'Tablero digital de goles']
  },
  {
    id: 'cancha-7a',
    name: 'Cancha 3 - Camp Nou',
    type: 'Fútbol 7',
    pricePerHour: 160000,
    depositPercentage: 50,
    image: 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=800&q=80',
    dimensions: '35m x 55m',
    grassType: 'Sintética Monofilamento Premium 60mm',
    features: ['Cancha Abierta al Aire Libre', 'Luz HD nocturna', 'Camerinos VIP con duchas', 'Estacionamiento reservado']
  },
  {
    id: 'cancha-11a',
    name: 'Cancha 4 - Santiago Bernabéu',
    type: 'Fútbol 11',
    pricePerHour: 260000,
    depositPercentage: 50,
    image: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=800&q=80',
    dimensions: '60m x 90m',
    grassType: 'Sintética Híbrida Profesional',
    features: ['Drenaje de alto impacto', 'Marcaje oficial FIFA', 'Tribuna para 200 personas', 'Vestuarios independientes']
  }
];

export const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: 'RES-8921',
    fieldId: 'cancha-5a',
    fieldName: 'Cancha 1 - La Bombonera',
    fieldType: 'Fútbol 5',
    date: new Date().toISOString().split('T')[0],
    startTime: '18:00',
    endTime: '19:00',
    customerName: 'Carlos Mendoza',
    customerPhone: '+57 310 456 7890',
    customerEmail: 'carlos.mendoza@gmail.com',
    totalPrice: 100000,
    depositAmount: 50000,
    remainingAmount: 50000,
    status: 'ABONADA_50',
    paymentMethodDeposit: 'Nequi',
    createdAt: new Date().toISOString(),
    qrCodeValue: 'AMB-RES-8921-50'
  },
  {
    id: 'RES-8922',
    fieldId: 'cancha-7a',
    fieldName: 'Cancha 3 - Camp Nou',
    fieldType: 'Fútbol 7',
    date: new Date().toISOString().split('T')[0],
    startTime: '19:00',
    endTime: '20:00',
    customerName: 'Andrés Ramírez',
    customerPhone: '+57 300 987 6543',
    customerEmail: 'andres.r@hotmail.com',
    totalPrice: 160000,
    depositAmount: 80000,
    remainingAmount: 80000,
    status: 'COMPLETADA_100',
    paymentMethodDeposit: 'PSE',
    paymentMethodRemaining: 'Efectivo en Cancha',
    createdAt: new Date().toISOString(),
    qrCodeValue: 'AMB-RES-8922-100'
  }
];

const STORAGE_KEY = 'ambeyma_reservations_v1';

export function getStoredReservations(): Reservation[] {
  if (typeof window === 'undefined') return INITIAL_RESERVATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_RESERVATIONS));
      return INITIAL_RESERVATIONS;
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading localStorage reservations', e);
    return INITIAL_RESERVATIONS;
  }
}

export function saveReservation(reservation: Reservation): Reservation {
  const current = getStoredReservations();
  const updated = [reservation, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }
  return reservation;
}

export function updateReservationPayment(id: string, paymentMethodRemaining: PaymentMethodRemaining): Reservation | null {
  const current = getStoredReservations();
  const index = current.findIndex(r => r.id === id);
  if (index === -1) return null;

  const updatedItem: Reservation = {
    ...current[index],
    status: 'COMPLETADA_100',
    paymentMethodRemaining,
    remainingAmount: 0
  };

  current[index] = updatedItem;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  }
  return updatedItem;
}

export function cancelReservationInStore(id: string): boolean {
  const current = getStoredReservations();
  const index = current.findIndex(r => r.id === id);
  if (index === -1) return false;

  current[index].status = 'CANCELADA';
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  }
  return true;
}

export function generateReservationId(): string {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `RES-${randomNum}`;
}
