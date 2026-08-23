'use client';

import React from 'react';
import { Field } from '@/lib/types';
import { ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react';

interface FieldCardProps {
  field: Field;
  onSelect: (field: Field) => void;
}

const DEFAULT_FEATURES = [
  'Iluminación LED HD',
  'Grama Sintética Pro',
  'Vestuarios & Duchas',
  'Balón oficial incluido'
];

export default function FieldCard({ field, onSelect }: FieldCardProps) {
  const depositAmount = (field.pricePerHour * field.depositPercentage) / 100;
  const remainingAmount = field.pricePerHour - depositAmount;

  const formatCOP = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val);
  };

  const featuresList = (field.features && field.features.length > 0) ? field.features : DEFAULT_FEATURES;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group">
      <div>
        {/* Field Image Header */}
        <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-slate-900">
          <img
            src={field.image || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80'}
            alt={field.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20" />
          
          {/* Badge Field Type */}
          <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md text-emerald-400 font-semibold text-xs px-3 py-1 rounded-full border border-slate-700/60 shadow-sm">
            {field.type}
          </div>

          {/* Badge 50% Deposit Required */}
          <div className="absolute top-3 right-3 bg-emerald-600/95 backdrop-blur-md text-white font-medium text-xs px-3 py-1 rounded-full flex items-center gap-1 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Aparta con 50%</span>
          </div>

          {/* Title Overlay */}
          <div className="absolute bottom-3 left-3 right-3 text-white">
            <h3 className="font-bold text-lg leading-tight tracking-tight drop-shadow-sm">
              {field.name}
            </h3>
            <p className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
              <span>{field.dimensions}</span> • <span>{field.grassType}</span>
            </p>
          </div>
        </div>

        {/* Card Body & Features */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
            {featuresList.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{feat}</span>
              </div>
            ))}
          </div>

          {/* Financial Breakdown Box (50% / 50%) */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Precio total por hora:</span>
              <span className="font-semibold text-slate-800 text-sm">{formatCOP(field.pricePerHour)}</span>
            </div>

            <div className="border-t border-slate-200/60 pt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-emerald-50 border border-emerald-200/60 p-2 rounded-lg">
                <span className="text-emerald-800 text-[11px] block font-medium">Abono Inicial (50%):</span>
                <span className="font-bold text-emerald-700 text-sm">{formatCOP(depositAmount)}</span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">Pagas online ahora</span>
              </div>

              <div className="bg-amber-50 border border-amber-200/60 p-2 rounded-lg">
                <span className="text-amber-800 text-[11px] block font-medium">Saldo Restante (50%):</span>
                <span className="font-bold text-amber-700 text-sm">{formatCOP(remainingAmount)}</span>
                <span className="text-[10px] text-amber-600 block mt-0.5">Pagas en cancha</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Action */}
      <div className="p-5 pt-0">
        <button
          onClick={() => onSelect(field)}
          className="w-full bg-slate-900 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm group-hover:bg-emerald-700"
        >
          <span>Apartar Horario con 50%</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
