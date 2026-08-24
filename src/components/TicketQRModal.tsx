'use client';

import React from 'react';
import { Reservation } from '@/lib/types';
import { X, CheckCircle2, ShieldCheck, Clock, Calendar, MapPin, Share2, Printer, AlertTriangle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

interface TicketQRModalProps {
  reservation: Reservation | null;
  onClose: () => void;
}

export default function TicketQRModal({ reservation, onClose }: TicketQRModalProps) {
  if (!reservation) return null;

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleShareWhatsApp = () => {
    const text = `⚽ *Reserva Cancha Sintética - Comprobante de Abono 50%*\n\n` +
      `📌 *Cancha:* ${reservation.fieldName}\n` +
      `📅 *Fecha:* ${reservation.date}\n` +
      `⏰ *Hora:* ${reservation.startTime} - ${reservation.endTime}\n` +
      `👤 *Capitán:* ${reservation.customerName}\n` +
      `✅ *Abono Pagado (50%):* ${formatCOP(reservation.depositAmount)} (${reservation.paymentMethodDeposit})\n` +
      `💵 *Saldo Pendiente (50%):* ${formatCOP(reservation.remainingAmount)} (A pagar en sitio)\n` +
      `🎟️ *Código Reserva:* ${reservation.id}\n\n` +
      `Presenta este ticket al ingresar a la cancha. ¡Nos vemos en el partido!`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-hidden">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Ticket Header Banner (Sticky Top) */}
        <div className="bg-emerald-700 text-white p-5 text-center relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 bg-emerald-800/80 hover:bg-emerald-900 text-white p-1.5 rounded-full transition-all shadow-sm focus:outline-none ring-2 ring-emerald-500/40"
            title="Cerrar Comprobante"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-1 text-white shadow-inner">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <h2 className="text-lg font-extrabold tracking-tight">¡Cancha Apartada Exitosamente!</h2>
          <p className="text-[11px] text-emerald-100 mt-0.5">Comprobante Digital de Reserva & Abono 50%</p>
        </div>

        {/* Ticket Details Body (Scrollable Area) */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 bg-slate-50/50">
          
          {/* Reservation ID & Status Badges */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs text-slate-500 font-medium">Código de Reserva:</span>
              <span className="font-mono font-bold text-slate-900 text-sm">{reservation.id}</span>
            </div>

            <div className="flex items-center justify-between text-xs gap-1">
              <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-2 py-0.5 rounded-full text-[11px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>50% ABONADO ONLINE</span>
              </div>

              <div className="flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-full text-[11px] font-bold">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>50% SALDO EN SITIO</span>
              </div>
            </div>
          </div>

          {/* Details List */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2 text-xs text-slate-700">
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-slate-400 block text-[10px]">Cancha</span>
                <span className="font-bold text-slate-900">{reservation.fieldName}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Fecha</span>
                  <span className="font-semibold text-slate-900">{reservation.date}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Horario</span>
                  <span className="font-semibold text-slate-900">{reservation.startTime} - {reservation.endTime}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-slate-400 block text-[10px]">Capitán Responsable</span>
              <span className="font-semibold text-slate-900">{reservation.customerName} ({reservation.customerPhone})</span>
            </div>
          </div>

          {/* Financial Ticket Breakdown */}
          <div className="bg-slate-900 text-white p-3.5 rounded-2xl space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Valor Total Reserva:</span>
              <span className="font-semibold">{formatCOP(reservation.totalPrice)}</span>
            </div>
            <div className="flex justify-between text-emerald-400 font-medium">
              <span>Abono 50% Pagado ({reservation.paymentMethodDeposit}):</span>
              <span className="font-bold">{formatCOP(reservation.depositAmount)}</span>
            </div>
            <div className="flex justify-between text-amber-400 font-medium border-t border-slate-800 pt-1.5">
              <span>Saldo 50% Pendiente (En sitio):</span>
              <span className="font-bold text-sm">{formatCOP(reservation.remainingAmount)}</span>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm text-center space-y-2">
            <div className="flex justify-center p-2 bg-slate-50 rounded-xl border border-slate-100">
              <QRCodeSVG value={reservation.qrCodeValue} size={120} />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Muestra este código QR al administrador al llegar a la cancha para cancelar el saldo restante.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleShareWhatsApp}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors shadow-sm"
            >
              <Share2 className="w-4 h-4" />
              <span>Enviar por WhatsApp</span>
            </button>

            <button
              onClick={() => window.print()}
              className="bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Ticket</span>
            </button>
          </div>

          {/* Close Ticket Button */}
          <button
            onClick={onClose}
            className="w-full bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-sm mt-1"
          >
            Entendido / Cerrar Comprobante
          </button>

        </div>

      </div>
    </div>
  );
}
