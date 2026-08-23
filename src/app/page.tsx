'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import FieldCard from '@/components/FieldCard';
import BookingFormModal from '@/components/BookingFormModal';
import TicketQRModal from '@/components/TicketQRModal';
import { MOCK_FIELDS } from '@/lib/store';
import { Field, Reservation } from '@/lib/types';
import { ShieldCheck, CalendarCheck, Zap, Trophy } from 'lucide-react';

export default function HomePage() {
  const [fields, setFields] = useState<Field[]>(MOCK_FIELDS);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [confirmedReservation, setConfirmedReservation] = useState<Reservation | null>(null);
  const [filterType, setFilterType] = useState<string>('TODAS');

  useEffect(() => {
    // Fetch available synthetic fields from API
    fetch('/api/fields')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setFields(data);
        }
      })
      .catch(err => console.error('Error cargando canchas desde la API:', err));
  }, []);

  const filteredFields = filterType === 'TODAS'
    ? fields
    : fields.filter(f => f.type === filterType);

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      <Navbar />

      {/* Hero Header Section */}
      <section className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          
          <div className="inline-flex items-center gap-2 bg-emerald-950/90 text-emerald-400 border border-emerald-800/80 px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sistema SaaS de Reservas con 50% de Abono Online</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Aparta tu Cancha Sintética con solo el <span className="text-emerald-400">50% de Abono</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Bloquea tu horario de juego pagando la mitad por Nequi, PSE o tarjeta. El <strong className="text-amber-400 font-semibold">50% restante lo pagas en la cancha</strong> al momento de ingresar a jugar.
          </p>

          {/* Feature Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto pt-6">
            <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-900/60 text-emerald-400 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Disponibilidad Real</h4>
                <p className="text-[11px] text-slate-400">Horarios actualizados en vivo</p>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-900/60 text-emerald-400 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Pago Dividido 50/50</h4>
                <p className="text-[11px] text-slate-400">50% Digital + 50% Presencial</p>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-2xl flex items-center gap-3 text-left">
              <div className="w-10 h-10 rounded-xl bg-emerald-900/60 text-emerald-400 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Comprobante QR</h4>
                <p className="text-[11px] text-slate-400">Ticket instantáneo en tu móvil</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-1 space-y-8">
        
        {/* Section Title & Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Nuestras Canchas Sintéticas</h2>
            <p className="text-xs text-slate-500">Selecciona tu cancha ideal y aparta tu horario preferido</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-1 rounded-xl text-xs font-medium">
            {['TODAS', 'Fútbol 5', 'Fútbol 7', 'Fútbol 11'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterType === type
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Fields Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFields.map((field) => (
            <FieldCard
              key={field.id}
              field={field}
              onSelect={(f) => setSelectedField(f)}
            />
          ))}
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2">
          <p className="font-medium text-slate-300">SaaS SintéticaPay • Sistema Profesional de Gestión y Abonos de Canchas</p>
          <p className="text-slate-500">Abono del 50% configurado para reservas seguras sin cancelaciones de último minuto.</p>
        </div>
      </footer>

      {/* Booking Form Modal */}
      {selectedField && (
        <BookingFormModal
          field={selectedField}
          onClose={() => setSelectedField(null)}
          onSuccess={(res) => {
            setSelectedField(null);
            setConfirmedReservation(res);
          }}
        />
      )}

      {/* Ticket QR Modal */}
      {confirmedReservation && (
        <TicketQRModal
          reservation={confirmedReservation}
          onClose={() => setConfirmedReservation(null)}
        />
      )}

    </div>
  );
}
