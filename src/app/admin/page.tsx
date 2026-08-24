'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import FieldFormModal from '@/components/FieldFormModal';
import { createClient } from '@/lib/supabase/client';
import { getStoredReservations, updateReservationPayment, cancelReservationInStore, saveReservation, MOCK_FIELDS } from '@/lib/store';
import { Reservation, Field, PaymentMethodRemaining } from '@/lib/types';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { DollarSign, ShieldCheck, CheckCircle2, Clock, Calendar, User, Phone, Search, AlertCircle, Plus, Check, X, Lock, Trophy, Edit, Trash2, Layers, LayoutGrid, Wrench, Info } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [authChecking, setAuthChecking] = useState<boolean>(true);

  // Active Tab: 'RESERVAS' vs 'CANCHAS'
  const [activeTab, setActiveTab] = useState<'RESERVAS' | 'CANCHAS'>('RESERVAS');

  // Fields State (CRUD)
  const [fields, setFields] = useState<Field[]>([]);
  const [fieldsLoading, setFieldsLoading] = useState<boolean>(false);
  const [fieldModalOpen, setFieldModalOpen] = useState<boolean>(false);
  const [editingField, setEditingField] = useState<Field | null>(null);

  // Reservations State (Supabase + Local fallback)
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState<string>('TODAS');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // State for collecting remaining 50%
  const [collectingReservation, setCollectingReservation] = useState<Reservation | null>(null);
  const [remainingPaymentMethod, setRemainingPaymentMethod] = useState<PaymentMethodRemaining>('Efectivo en Cancha');

  // State for Admin Schedule Override / Block Modal
  const [showBlockModal, setShowBlockModal] = useState<boolean>(false);
  const [blockFieldId, setBlockFieldId] = useState<string>('');
  const [blockTime, setBlockTime] = useState<string>('19:00');
  const [blockReason, setBlockReason] = useState<string>('Mantenimiento / Reparación de Cancha');
  const [blockCustomerName, setBlockCustomerName] = useState<string>('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login');
      } else {
        setUser(data.user);
        fetchFields();
        fetchReservations(selectedDate);
        setAuthChecking(false);
      }
    });
  }, [router, selectedDate]);

  const fetchFields = async () => {
    setFieldsLoading(true);
    try {
      const res = await fetch('/api/fields');
      if (res.ok) {
        const data = await res.json();
        setFields(data);
        if (data.length > 0) setBlockFieldId(data[0].id);
      }
    } catch (e) {
      console.error('Error fetching fields:', e);
      setFields(MOCK_FIELDS);
    } finally {
      setFieldsLoading(false);
    }
  };

  const fetchReservations = async (dateStr: string) => {
    try {
      const res = await fetch(`/api/reservations?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        // Merge Supabase DB reservations with local storage reservations
        const localData = getStoredReservations().filter(r => r.date === dateStr);
        const combined = [...data];

        localData.forEach((lr: Reservation) => {
          if (!combined.some(dbR => dbR.id === lr.id)) {
            combined.push(lr);
          }
        });

        setReservations(combined);
      } else {
        setReservations(getStoredReservations().filter(r => r.date === dateStr));
      }
    } catch (e) {
      console.error('Error fetching reservations from Supabase:', e);
      setReservations(getStoredReservations().filter(r => r.date === dateStr));
    }
  };

  const handleDeleteField = async (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar la cancha "${name}"?`)) {
      try {
        const res = await fetch(`/api/fields/${id}`, { method: 'DELETE' });
        if (res.ok) {
          fetchFields();
        } else {
          alert('Error al eliminar la cancha.');
        }
      } catch (e) {
        alert('Error de conexión al eliminar cancha.');
      }
    }
  };

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-center items-center p-4">
        <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-2xl">
          <Lock className="w-6 h-6 text-emerald-500 animate-pulse" />
          <span className="text-sm font-semibold">Verificando sesión privada de administrador...</span>
        </div>
      </div>
    );
  }

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

  const handleConfirmRemainingPayment = async () => {
    if (!collectingReservation) return;

    try {
      await fetch(`/api/reservations/${collectingReservation.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethodRemaining: remainingPaymentMethod,
          status: 'COMPLETADA_100',
        }),
      });
    } catch (e) {
      console.error('Error updating payment in Supabase:', e);
    }

    updateReservationPayment(collectingReservation.id, remainingPaymentMethod);
    setCollectingReservation(null);
    fetchReservations(selectedDate);
  };

  const handleCancelReservation = (id: string) => {
    if (confirm('¿Estás seguro de cancelar esta reserva?')) {
      cancelReservationInStore(id);
      fetchReservations(selectedDate);
    }
  };

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetField = fields.find(f => f.id === blockFieldId) || MOCK_FIELDS[0];
    const endHour = parseInt(blockTime.split(':')[0]) + 1;
    const endTimeStr = `${endHour.toString().padStart(2, '0')}:00`;
    const fullReason = blockCustomerName ? `${blockReason} (${blockCustomerName})` : blockReason;

    try {
      // Post to Supabase API so clients immediately see the block!
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fieldId: targetField.id,
          date: selectedDate,
          startTime: blockTime,
          endTime: endTimeStr,
          customerName: fullReason,
          customerPhone: 'N/A (Bloqueo Admin)',
          customerEmail: user?.email || 'admin@cancha.com',
          paymentMethodDeposit: 'Bloqueo Admin',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || 'Error al guardar el bloqueo en Supabase');
      }
    } catch (err) {
      console.error('Error creating block in Supabase:', err);
    }

    setShowBlockModal(false);
    setBlockCustomerName('');
    fetchReservations(selectedDate);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 flex-1 space-y-4 sm:space-y-6 min-w-0">
        
        {/* Informative Role Banner */}
        <div className="bg-slate-900 text-slate-100 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-800 flex items-start gap-2.5 sm:gap-3 text-xs shadow-sm">
          <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 min-w-0">
            <span className="font-bold text-white block">Rol del Administrador vs. Cliente</span>
            <p className="text-slate-300 leading-relaxed">
              Los <strong>clientes reservan y pagan el 50% de abono online desde la web pública</strong>. Desde este panel administras el <strong>cobro del 50% restante en efectivo/sitio</strong> cuando los jugadores llegan a la cancha y gestionas bloqueos por mantenimiento o llamadas.
            </p>
          </div>
        </div>

        {/* Header & Tabs Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-white p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm min-w-0">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="bg-emerald-100 text-emerald-800 text-[11px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 truncate max-w-[210px] sm:max-w-none">
                Panel Privado • {user?.email}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 hidden xs:inline">Gestión de Caja & Canchas</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Control de Caja & Reservas (50/50)
            </h1>
          </div>

          {/* Dashboard Main Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 p-1 sm:p-1.5 rounded-xl text-xs font-bold w-full md:w-auto">
            <button
              onClick={() => setActiveTab('RESERVAS')}
              className={`flex-1 md:flex-none justify-center flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all text-center text-[11px] sm:text-xs ${
                activeTab === 'RESERVAS'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
              <span>Caja & Reservas</span>
            </button>

            <button
              onClick={() => setActiveTab('CANCHAS')}
              className={`flex-1 md:flex-none justify-center flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all text-center text-[11px] sm:text-xs ${
                activeTab === 'CANCHAS'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
              <span>Mis Canchas ({fields.length})</span>
            </button>
          </div>
        </div>

        {/* TAB 1: RESERVAS & CONTROL DE CAJA */}
        {activeTab === 'RESERVAS' && (
          <div className="space-y-4 sm:space-y-6 min-w-0">
            
            {/* Financial Metrics Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] sm:text-xs font-medium text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  Abonado Online (50% Recaudado)
                </span>
                <div className="text-xl sm:text-2xl font-extrabold text-emerald-600">
                  {formatCOP(totalDepositsCollected)}
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-400 block">Abonos pagados por clientes en la web</span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] sm:text-xs font-medium text-slate-500 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  Saldo por Cobrar en Sitio (50%)
                </span>
                <div className="text-xl sm:text-2xl font-extrabold text-amber-600">
                  {formatCOP(totalRemainingPending)}
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-400 block">Pendiente por cobrar en caja presencial</span>
              </div>

              <div className="bg-white p-4 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm space-y-1">
                <span className="text-[11px] sm:text-xs font-medium text-slate-500 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  Cobrado Presencial (Caja Sitio)
                </span>
                <div className="text-xl sm:text-2xl font-extrabold text-blue-600">
                  {formatCOP(totalRemainingCollected)}
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-400 block">Efectivo / Datáfono en cancha</span>
              </div>

              <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-sm space-y-1">
                <span className="text-[11px] sm:text-xs font-medium text-slate-300 flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                  Total Proyectado del Día
                </span>
                <div className="text-xl sm:text-2xl font-extrabold text-white">
                  {formatCOP(totalProjectedRevenue)}
                </div>
                <span className="text-[10px] sm:text-[11px] text-slate-400 block">{dateReservations.length} partido(s) agendados</span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 min-w-0">
              <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2.5 w-full lg:w-auto min-w-0">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 shrink-0">
                  <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-medium overflow-x-auto min-w-0 w-full xs:w-auto">
                  {['TODAS', 'ABONADA_50', 'COMPLETADA_100', 'CANCELADA'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setFilterStatus(st)}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-lg whitespace-nowrap transition-all text-[11px] sm:text-xs shrink-0 ${
                        filterStatus === st
                          ? 'bg-slate-900 text-white font-bold shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st === 'TODAS' ? 'Todas' : st === 'ABONADA_50' ? 'Solo 50%' : st === 'COMPLETADA_100' ? '100% Pagadas' : 'Canceladas'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-2 w-full lg:w-auto">
                <div className="relative w-full lg:w-60">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar código o cliente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Admin Schedule Override Button */}
                <button
                  onClick={() => setShowBlockModal(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-sm shrink-0"
                >
                  <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Bloquear Horario</span>
                </button>
              </div>
            </div>

            {/* Reservations Display: Mobile Cards (< md) vs Desktop Table (>= md) */}
            <div className="bg-white border border-slate-200 rounded-xl sm:rounded-2xl shadow-sm overflow-hidden">
              
              {/* MOBILE CARDS VIEW (< md) */}
              <div className="block md:hidden divide-y divide-slate-100">
                {filteredReservations.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs">
                    No hay reservas ni bloqueos registrados para esta fecha o filtro.
                  </div>
                ) : (
                  filteredReservations.map((r) => (
                    <div key={r.id} className="p-4 space-y-3">
                      {/* Top Header: ID, Time, Status */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono font-bold text-sm text-slate-900">{r.id}</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                            <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            {r.startTime} - {r.endTime}
                          </span>
                        </div>

                        <div>
                          {r.status === 'ABONADA_50' && (
                            <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Falta 50% en Sitio
                            </span>
                          )}
                          {r.status === 'COMPLETADA_100' && (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Pagado 100%
                            </span>
                          )}
                          {r.status === 'CANCELADA' && (
                            <span className="inline-flex items-center gap-1 bg-red-50 text-red-800 border border-red-200 px-2.5 py-1 rounded-full text-[10px] font-bold">
                              <X className="w-3 h-3 text-red-600" />
                              Cancelada
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Cancha</span>
                          <span className="font-semibold text-slate-900 block truncate">
                            {r.fieldName || fields.find(f => f.id === r.fieldId)?.name || 'Cancha'}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {r.fieldType || fields.find(f => f.id === r.fieldId)?.type}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-medium">Capitán / Contacto</span>
                          <span className="font-semibold text-slate-900 block truncate">{r.customerName}</span>
                          {r.customerPhone && r.customerPhone !== 'N/A (Bloqueo Admin)' ? (
                            <a href={`tel:${r.customerPhone}`} className="text-[10px] text-emerald-600 font-medium hover:underline flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" />
                              {r.customerPhone}
                            </a>
                          ) : (
                            <span className="text-[10px] text-slate-400">{r.customerPhone}</span>
                          )}
                        </div>

                        <div className="col-span-2 border-t border-slate-200/60 pt-2 mt-1 flex justify-between items-center text-[11px]">
                          <span className="text-slate-500">Total: <strong>{formatCOP(r.totalPrice)}</strong></span>
                          <span className="text-emerald-700 font-medium">Abono: {formatCOP(r.depositAmount)}</span>
                          <span className="text-amber-700 font-bold">Saldo: {formatCOP(r.remainingAmount)}</span>
                        </div>
                      </div>

                      {/* Action Button for Mobile */}
                      {r.status === 'ABONADA_50' && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => setCollectingReservation(r)}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-colors shadow-sm text-center flex items-center justify-center gap-1"
                          >
                            <DollarSign className="w-4 h-4" />
                            <span>Cobrar {formatCOP(r.remainingAmount)} en Sitio</span>
                          </button>
                          <button
                            onClick={() => handleCancelReservation(r.id)}
                            className="text-slate-400 hover:text-red-600 p-2.5 rounded-xl bg-slate-50 border border-slate-200 hover:bg-red-50 transition-colors shrink-0"
                            title="Cancelar Reserva"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* DESKTOP TABLE VIEW (>= md) */}
              <div className="hidden md:block overflow-x-auto">
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
                          No hay reservas ni bloqueos registrados para esta fecha o filtro.
                        </td>
                      </tr>
                    ) : (
                      filteredReservations.map((r) => (
                        <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4">
                            <span className="font-mono font-bold text-slate-900 block">{r.id}</span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-emerald-600" />
                              {r.startTime} - {r.endTime}
                            </span>
                          </td>

                          <td className="p-4 font-semibold text-slate-900">
                            {r.fieldName || fields.find(f => f.id === r.fieldId)?.name || 'Cancha'}
                            <span className="text-[10px] text-slate-400 block font-normal">{r.fieldType || fields.find(f => f.id === r.fieldId)?.type}</span>
                          </td>

                          <td className="p-4">
                            <span className="font-semibold text-slate-900 block">{r.customerName}</span>
                            <span className="text-[11px] text-slate-500">{r.customerPhone}</span>
                          </td>

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

          </div>
        )}

        {/* TAB 2: GESTIÓN DE CANCHAS (CRUD) */}
        {activeTab === 'CANCHAS' && (
          <div className="space-y-6">
            
            {/* CRUD Action Banner */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Catálogo de Canchas Sintéticas</h2>
                <p className="text-xs text-slate-500">Crea, edita o elimina las canchas disponibles para tu establecimiento</p>
              </div>

              <button
                onClick={() => {
                  setEditingField(null);
                  setFieldModalOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 text-xs transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>+ Agregar Nueva Cancha</span>
              </button>
            </div>

            {/* Fields Grid */}
            {fieldsLoading ? (
              <div className="bg-white p-12 rounded-2xl text-center text-slate-400 text-xs">
                Cargando canchas desde Supabase...
              </div>
            ) : fields.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl text-center text-slate-500 text-xs space-y-3">
                <Trophy className="w-8 h-8 text-slate-300 mx-auto" />
                <p>Aún no has registrado canchas para tu establecimiento.</p>
                <button
                  onClick={() => {
                    setEditingField(null);
                    setFieldModalOpen(true);
                  }}
                  className="bg-slate-900 text-white font-bold py-2 px-4 rounded-xl text-xs"
                >
                  Registrar mi Primera Cancha
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fields.map((f) => (
                  <div key={f.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between group">
                    <div>
                      {/* Image Header */}
                      <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                        <img src={f.image} alt={f.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" />
                        <div className="absolute top-3 left-3 bg-slate-900/90 text-emerald-400 font-bold text-xs px-2.5 py-0.5 rounded-full border border-slate-700">
                          {f.type}
                        </div>
                        <div className="absolute top-3 right-3 bg-emerald-600 text-white font-semibold text-xs px-2.5 py-0.5 rounded-full shadow-sm">
                          50% Abono
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-5 space-y-3">
                        <h3 className="font-bold text-base text-slate-900">{f.name}</h3>
                        <div className="text-xs text-slate-500 space-y-1">
                          <p className="flex items-center gap-1.5">
                            <LayoutGrid className="w-3.5 h-3.5 text-slate-400" />
                            <span>Dimensiones: <strong>{f.dimensions}</strong></span>
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            <span>Grama: <strong>{f.grassType}</strong></span>
                          </p>
                        </div>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                          <span className="text-slate-500">Precio Total por hora:</span>
                          <span className="font-bold text-slate-900 text-sm">{formatCOP(f.pricePerHour)}</span>
                        </div>
                      </div>
                    </div>

                    {/* CRUD Actions Footer */}
                    <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          setEditingField(f);
                          setFieldModalOpen(true);
                        }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5 text-slate-600" />
                        <span>Editar</span>
                      </button>

                      <button
                        onClick={() => handleDeleteField(f.id, f.name)}
                        className="bg-red-50 hover:bg-red-100 text-red-700 font-semibold py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span>Eliminar</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </main>

      {/* CRUD Form Modal for Create & Edit Field */}
      {fieldModalOpen && (
        <FieldFormModal
          field={editingField}
          onClose={() => {
            setFieldModalOpen(false);
            setEditingField(null);
          }}
          onSaveSuccess={() => {
            fetchFields();
          }}
        />
      )}

      {/* Modal for Registering Remaining 50% Payment in Cash/POS */}
      {collectingReservation && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Registrar Cobro Presencial (50%)</h3>
              <button onClick={() => setCollectingReservation(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs space-y-1.5">
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Reserva:</span>
                <span className="font-bold text-slate-900 truncate">{collectingReservation.id} ({collectingReservation.fieldName})</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500">Capitán:</span>
                <span className="font-semibold text-slate-800 truncate">{collectingReservation.customerName}</span>
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

      {/* Modal for Admin Schedule Block / Override */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <form onSubmit={handleCreateBlock} className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-5 sm:p-6 space-y-4 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Bloquear Horario en Agenda</h3>
              </div>
              <button type="button" onClick={() => setShowBlockModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Usa esta función únicamente para deshabilitar un horario debido a reparaciones, llamadas telefónicas o torneos locales.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Cancha a Bloquear</label>
                <select
                  value={blockFieldId}
                  onChange={(e) => setBlockFieldId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {fields.map(f => (
                    <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Hora de Inicio (1 Hora)</label>
                <select
                  value={blockTime}
                  onChange={(e) => setBlockTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  {['16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Motivo del Bloqueo</label>
                <select
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                >
                  <option value="Mantenimiento / Reparación de Cancha">Mantenimiento / Reparación de Cancha</option>
                  <option value="Reserva Telefónica / WhatsApp">Reserva Telefónica / WhatsApp</option>
                  <option value="Torneo Local / Escuela de Fútbol">Torneo Local / Escuela de Fútbol</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Detalles Adicionales (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Pintura de líneas / Llamada Don Pedro"
                  value={blockCustomerName}
                  onChange={(e) => setBlockCustomerName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-slate-900 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md text-xs"
            >
              Bloquear Horario en la Web
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
