'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { getStoredReservations, updateReservationPayment, cancelReservationInStore, saveReservation, generateReservationId, MOCK_FIELDS } from '@/lib/store';
import { Reservation, PaymentMethodRemaining } from '@/lib/types';
import { DollarSign, ShieldCheck, CheckCircle2, Clock, Calendar, User, Phone, Search, Filter, AlertCircle, Plus, Check, X } from 'lucide-react';

export default function AdminPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState<string>('TODAS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // State for collecting the remaining 50% on site
  const [collectingReservation, setCollectingReservation] = useState<Reservation | null>(null);
  const [remainingPaymentMethod, setRemainingPaymentMethod] = useState<PaymentMethodRemaining>('Efectivo en Cancha');

  // State for manual booking modal
  const [showManualModal, setShowManualModal] = useState<boolean>(false);
  const [manualFieldId, setManualFieldId] = useState<string>(MOCK_FIELDS[0].id);
  const [manualTime, setManualTime] = useState<string>('19:00');
  const [manualCustomer, setManualCustomer] = useState<string>('');
  const [manualPhone, setManualPhone] = useState<string>('');

  useEffect(() => {
    setReservations(getStoredReservations());
  }, []);

  const refreshReservations = () => {
    setReservations(getStoredReservations());
  };

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Filter reservations by date, status, search
  const filteredReservations = reservations.filter(r => {
    const matchesDate = r.date === selectedDate;
    const matchesStatus = filterStatus === 'TODAS' || r.status === filterStatus;
    const matchesSearch = searchQuery === '' || 
      r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.customerPhone.includes(searchQuery);

    return matchesDate && matchesStatus && matchesSearch;
  });

  // Calculate Metrics for selected date
  const dateReservations = reservations.filter(r => r.date === selectedDate && r.status !== 'CANCELADA');
  const totalDepositsCollected = dateReservations.reduce((sum, r) => sum + r.depositAmount, 0);
  const totalRemainingPending = dateReservations.reduce((sum, r) => sum + (r.status === 'ABONADA_50' ? r.remainingAmount : 0), 0);
  const totalRemainingCollected = dateReservations.reduce((sum, r) => sum + (r.status === 'COMPLETADA_100' ? r.remainingAmount : 0), 0);
  const totalProjectedRevenue = totalDepositsCollected + totalRemainingPending + totalRemainingCollected;

  const handleConfirmRemainingPayment = () => {
    if (!collectingReservation) return;
    updateReservationPayment(collectingReservation.id, remainingPaymentMethod);
    setCollectingReservation(null);
    refreshReservations();
  };

  const handleCancelReservation = (id: string) => {
    if (confirm('¿Estás seguro de cancelar esta reserva?')) {
      cancelReservationInStore(id);
      refreshReservations();
    }
  };

  const handleCreateManualBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const targetField = MOCK_FIELDS.find(f => f.id === manualFieldId) || MOCK_FIELDS[0];
    const resId = generateReservationId();
    const endHour = parseInt(manualTime.split(':')[0]) + 1;

    const newRes: Reservation = {
      id: resId,
      fieldId: targetField.id,
      fieldName: targetField.name,
      fieldType: targetField.type,
      date: selectedDate,
      startTime: manualTime,
      endTime: `${endHour.toString().padStart(2, '0')}:00`,
      customerName: manualCustomer || 'Cliente Presencial (Manual)',
      customerPhone: manualPhone || 'N/A',
      customerEmail: 'admin@cancha.com',
      totalPrice: targetField.pricePerHour,
      depositAmount: targetField.pricePerHour / 2,
      remainingAmount: targetField.pricePerHour / 2,
      status: 'ABONADA_50',
      paymentMethodDeposit: 'Nequi',
      createdAt: new Date().toISOString(),
      qrCodeValue: `MANUAL-${resId}`
    };

    saveReservation(newRes);
    setShowManualModal(false);
    setManualCustomer('');
    setManualPhone('');
    refreshReservations();
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-6">
        
        {/* Header & Date Selector */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                Panel de Administración
              </span>
              <span className="text-xs text-slate-500">Gestión de Caja & Canchas</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Control de Reservas y Abonos
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-800 focus:outline-none"
              />
            </div>

            <button
              onClick={() => setShowManualModal(true)}
              className="bg-slate-900 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 px-3.5 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Bloquear / Reserva Manual</span>
            </button>
          </div>
        </div>

        {/* Financial Metrics Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Abonado Online (50% Recaudado)
            </span>
            <div className="text-2xl font-extrabold text-emerald-600">
              {formatCOP(totalDepositsCollected)}
            </div>
            <span className="text-[11px] text-slate-400 block">Dinero ya asegurado en cuenta</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Saldo por Cobrar en Sitio (50%)
            </span>
            <div className="text-2xl font-extrabold text-amber-600">
              {formatCOP(totalRemainingPending)}
            </div>
            <span className="text-[11px] text-slate-400 block">Por cobrar hoy al llegar jugadores</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              Cobrado Presencial (Caja Sitio)
            </span>
            <div className="text-2xl font-extrabold text-blue-600">
              {formatCOP(totalRemainingCollected)}
            </div>
            <span className="text-[11px] text-slate-400 block">Efectivo / Datáfono en cancha</span>
          </div>

          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-1">
            <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Total Proyectado del Día
            </span>
            <div className="text-2xl font-extrabold text-white">
              {formatCOP(totalProjectedRevenue)}
            </div>
            <span className="text-[11px] text-slate-400 block">{dateReservations.length} partido(s) agendados</span>
          </div>

        </div>

        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Status Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-medium w-full sm:w-auto overflow-x-auto">
            {['TODAS', 'ABONADA_50', 'COMPLETADA_100', 'CANCELADA'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                  filterStatus === st
                    ? 'bg-slate-900 text-white font-bold shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st === 'TODAS' ? 'Todas' : st === 'ABONADA_50' ? 'Solo 50% Abonado' : st === 'COMPLETADA_100' ? 'Pagadas 100%' : 'Canceladas'}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por código o cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

        </div>

        {/* Reservations Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">Código / Hora</th>
                  <th className="p-4">Cancha</th>
                  <th className="p-4">Capitán / Contacto</th>
                  <th className="p-4">Desglose 50% / 50%</th>
                  <th className="p-4">Estado Financiero</th>
                  <th className="p-4 text-right">Acción de Caja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 text-sm">
                      No hay reservas registradas para esta fecha o filtro.
                    </td>
                  </tr>
                ) : (
                  filteredReservations.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Code & Time */}
                      <td className="p-4">
                        <span className="font-mono font-bold text-slate-900 block">{r.id}</span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-emerald-600" />
                          {r.startTime} - {r.endTime}
                        </span>
                      </td>

                      {/* Field */}
                      <td className="p-4 font-semibold text-slate-900">
                        {r.fieldName}
                        <span className="text-[10px] text-slate-400 block font-normal">{r.fieldType}</span>
                      </td>

                      {/* Customer */}
                      <td className="p-4">
                        <span className="font-semibold text-slate-900 block">{r.customerName}</span>
                        <span className="text-[11px] text-slate-500">{r.customerPhone}</span>
                      </td>

                      {/* Price Breakdown */}
                      <td className="p-4 space-y-0.5">
                        <div className="text-[11px] text-slate-500">
                          Total: <strong className="text-slate-800">{formatCOP(r.totalPrice)}</strong>
                        </div>
                        <div className="text-[11px] text-emerald-700 font-medium">
                          Abono (50%): {formatCOP(r.depositAmount)} ({r.paymentMethodDeposit})
                        </div>
                        <div className="text-[11px] text-amber-700 font-medium">
                          Saldo (50%): {formatCOP(r.remainingAmount)}
                        </div>
                      </td>

                      {/* Status Badges */}
                      <td className="p-4">
                        {r.status === 'ABONADA_50' && (
                          <div className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>Abonado 50% (Falta Sitio)</span>
                          </div>
                        )}

                        {r.status === 'COMPLETADA_100' && (
                          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Pagado 100% ({r.paymentMethodRemaining || 'Presencial'})</span>
                          </div>
                        )}

                        {r.status === 'CANCELADA' && (
                          <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-800 border border-red-200 px-2.5 py-1 rounded-full text-[11px] font-bold">
                            <X className="w-3 h-3 text-red-600" />
                            <span>Cancelada</span>
                          </div>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="p-4 text-right">
                        {r.status === 'ABONADA_50' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setCollectingReservation(r)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-colors shadow-sm"
                            >
                              Cobrar {formatCOP(r.remainingAmount)} en Sitio
                            </button>
                            <button
                              onClick={() => handleCancelReservation(r.id)}
                              className="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                              title="Cancelar Reserva"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {r.status === 'COMPLETADA_100' && (
                          <span className="text-xs text-slate-400 italic">Caja cerrada ✓</span>
                        )}
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Modal for Registering Remaining 50% Payment in Cash/POS */}
      {collectingReservation && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Registrar Cobro Presencial (50%)</h3>
              <button onClick={() => setCollectingReservation(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Reserva:</span>
                <span className="font-bold text-slate-900">{collectingReservation.id} ({collectingReservation.fieldName})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Capitán:</span>
                <span className="font-semibold text-slate-800">{collectingReservation.customerName}</span>
              </div>
              <div className="flex justify-between text-amber-700 font-bold border-t border-slate-200/60 pt-1.5">
                <span>Monto a Cobrar en Caja:</span>
                <span className="text-sm">{formatCOP(collectingReservation.remainingAmount)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 block">Selecciona Método de Pago recibido en sitio:</label>
              <div className="grid grid-cols-1 gap-2">
                {(['Efectivo en Cancha', 'Datáfono en Sitio', 'Transferencia en Sitio'] as PaymentMethodRemaining[]).map((pm) => (
                  <button
                    key={pm}
                    type="button"
                    onClick={() => setRemainingPaymentMethod(pm)}
                    className={`p-3 rounded-xl border text-xs font-medium text-left flex items-center justify-between transition-all ${
                      remainingPaymentMethod === pm
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <span>{pm}</span>
                    {remainingPaymentMethod === pm && <Check className="w-4 h-4 text-emerald-600" />}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleConfirmRemainingPayment}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-colors shadow-md text-xs"
            >
              Confirmar Recibo de {formatCOP(collectingReservation.remainingAmount)} y Cerrar Reserva
            </button>

          </div>
        </div>
      )}

      {/* Modal for Manual Booking / Lock Slot */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateManualBooking} className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Reserva Manual / Bloqueo de Horario</h3>
              <button type="button" onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-medium text-slate-700 block mb-1">Cancha</label>
                <select
                  value={manualFieldId}
                  onChange={(e) => setManualFieldId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                >
                  {MOCK_FIELDS.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Hora de Inicio</label>
                <select
                  value={manualTime}
                  onChange={(e) => setManualTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                >
                  {['16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Nombre / Identificación del Grupo</label>
                <input
                  type="text"
                  placeholder="Ej: Torneo Vecinal / Partido Don José"
                  value={manualCustomer}
                  onChange={(e) => setManualCustomer(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="font-medium text-slate-700 block mb-1">Teléfono Contacto</label>
                <input
                  type="text"
                  placeholder="+57 300 000 0000"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md text-xs"
            >
              Registrar Reserva en Agenda
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
