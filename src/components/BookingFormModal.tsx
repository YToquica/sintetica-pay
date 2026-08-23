'use client';

import React, { useState, useEffect } from 'react';
import { Field, Reservation, PaymentMethodDeposit } from '@/lib/types';
import { getStoredReservations, saveReservation, generateReservationId } from '@/lib/store';
import { X, Calendar, Clock, User, Phone, Mail, CreditCard, ShieldCheck, Check, AlertCircle } from 'lucide-react';

interface BookingFormModalProps {
  field: Field | null;
  onClose: () => void;
  onSuccess: (reservation: Reservation) => void;
}

const AVAILABLE_TIMES = [
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'
];

export default function BookingFormModal({ field, onClose, onSuccess }: BookingFormModalProps) {
  if (!field) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedTime, setSelectedTime] = useState<string>('18:00');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodDeposit>('Nequi');
  
  const [dbReservations, setDbReservations] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const depositAmount = (field.pricePerHour * field.depositPercentage) / 100;
  const remainingAmount = field.pricePerHour - depositAmount;

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Fetch reservations from API (Supabase) when selected date changes
  useEffect(() => {
    fetch(`/api/reservations?date=${selectedDate}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setDbReservations(data);
        }
      })
      .catch(err => console.error('Error fetching reservations:', err));
  }, [selectedDate]);

  // Check if slot is occupied in Supabase DB or Local Store
  const localReservations = getStoredReservations();
  const isTimeOccupied = (time: string) => {
    const isOccupiedLocal = localReservations.some(
      r => r.fieldId === field.id && r.date === selectedDate && r.startTime === time && r.status !== 'CANCELADA'
    );

    const isOccupiedDb = dbReservations.some(
      r => r.fieldId === field.id && r.date === selectedDate && r.startTime === time && r.status !== 'CANCELADA'
    );

    return isOccupiedLocal || isOccupiedDb;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!customerName || !customerPhone || !customerEmail) {
      setErrorMsg('Por favor completa todos los datos de contacto del responsable de la reserva.');
      return;
    }

    if (isTimeOccupied(selectedTime)) {
      setErrorMsg(`El horario ${selectedTime} del ${selectedDate} ya fue apartado o está en mantenimiento. Elige otro horario.`);
      return;
    }

    setIsProcessing(true);

    try {
      const endHourNum = parseInt(selectedTime.split(':')[0]) + 1;
      const endTimeStr = `${endHourNum.toString().padStart(2, '0')}:00`;

      // 1. Post reservation to Supabase API
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldId: field.id,
          date: selectedDate,
          startTime: selectedTime,
          endTime: endTimeStr,
          customerName,
          customerPhone,
          customerEmail,
          paymentMethodDeposit: paymentMethod,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al guardar la reserva');
      }

      const createdRes = await res.json();

      // 2. Save locally for fallback & instant QR
      const resId = createdRes.id || generateReservationId();
      const newReservation: Reservation = {
        id: resId,
        fieldId: field.id,
        fieldName: field.name,
        fieldType: field.type,
        date: selectedDate,
        startTime: selectedTime,
        endTime: endTimeStr,
        customerName,
        customerPhone,
        customerEmail,
        totalPrice: field.pricePerHour,
        depositAmount,
        remainingAmount,
        status: 'ABONADA_50',
        paymentMethodDeposit: paymentMethod,
        createdAt: new Date().toISOString(),
        qrCodeValue: createdRes.qrCodeValue || `SINTETICA-PAY-${resId}`
      };

      saveReservation(newReservation);
      setIsProcessing(false);
      onSuccess(newReservation);
    } catch (err: any) {
      console.error('Error submitting booking:', err);
      // Fallback local creation if API temporary error
      const resId = generateReservationId();
      const endHourNum = parseInt(selectedTime.split(':')[0]) + 1;
      const endTimeStr = `${endHourNum.toString().padStart(2, '0')}:00`;
      const fallbackRes: Reservation = {
        id: resId,
        fieldId: field.id,
        fieldName: field.name,
        fieldType: field.type,
        date: selectedDate,
        startTime: selectedTime,
        endTime: endTimeStr,
        customerName,
        customerPhone,
        customerEmail,
        totalPrice: field.pricePerHour,
        depositAmount,
        remainingAmount,
        status: 'ABONADA_50',
        paymentMethodDeposit: paymentMethod,
        createdAt: new Date().toISOString(),
        qrCodeValue: `SINTETICA-PAY-${resId}`
      };
      saveReservation(fallbackRes);
      setIsProcessing(false);
      onSuccess(fallbackRes);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-600 text-white text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                Reserva 50% Abono
              </span>
              <span className="text-xs text-slate-400">{field.type}</span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1">{field.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Date & Time Selection */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              1. Selecciona Fecha y Horario
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Fecha del Partido</label>
                <input
                  type="date"
                  min={todayStr}
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Hora de Inicio (1 hora)</label>
                <div className="relative">
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                  >
                    {AVAILABLE_TIMES.map((t) => {
                      const occupied = isTimeOccupied(t);
                      return (
                        <option key={t} value={t} disabled={occupied}>
                          {t} - {parseInt(t.split(':')[0]) + 1}:00 {occupied ? '(OCUPADO / MANTENIMIENTO)' : '(Disponible)'}
                        </option>
                      );
                    })}
                  </select>
                  <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Customer Details */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-600" />
              2. Datos del Capitán / Responsable
            </h3>

            <div className="space-y-2.5">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="+57 300 000 0000"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="juan@email.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method for 50% Deposit */}
          <div className="space-y-3 border-t border-slate-100 pt-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              3. Pasarela de Pago para el Abono del 50% ({formatCOP(depositAmount)})
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {(['Nequi', 'PSE', 'Tarjeta de Crédito', 'Mercado Pago'] as PaymentMethodDeposit[]).map((pm) => (
                <button
                  type="button"
                  key={pm}
                  onClick={() => setPaymentMethod(pm)}
                  className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between transition-all ${
                    paymentMethod === pm
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span>{pm}</span>
                  {paymentMethod === pm && <Check className="w-4 h-4 text-emerald-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* Order Summary & Split Payment Box */}
          <div className="bg-slate-900 text-slate-100 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
              <span>Resumen Financiero de la Reserva:</span>
              <span className="font-semibold text-white">{field.name}</span>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Valor Total Cancha (1 Hora):</span>
                <span className="font-medium text-white">{formatCOP(field.pricePerHour)}</span>
              </div>

              <div className="flex justify-between text-emerald-400 font-medium">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Pagas AHORA (Abono 50% Online):
                </span>
                <span className="text-sm font-bold">{formatCOP(depositAmount)}</span>
              </div>

              <div className="flex justify-between text-amber-400 font-medium">
                <span>Pagas EN LA CANCHA (Saldo 50% Sitio):</span>
                <span className="text-sm font-bold">{formatCOP(remainingAmount)}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
          >
            {isProcessing ? (
              <span>Procesando Abono de {formatCOP(depositAmount)}...</span>
            ) : (
              <span>Pagar Abono de {formatCOP(depositAmount)} y Bloquear Cancha</span>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
