'use client';

import React, { useState, useEffect } from 'react';
import { Field } from '@/lib/types';
import { X, Trophy, DollarSign, Image as ImageIcon, Ruler, Layers, Check, AlertCircle } from 'lucide-react';

interface FieldFormModalProps {
  field: Field | null; // null for Create mode, Field object for Edit mode
  onClose: () => void;
  onSaveSuccess: () => void;
}

export default function FieldFormModal({ field, onClose, onSaveSuccess }: FieldFormModalProps) {
  const isEditing = Boolean(field);

  const [name, setName] = useState(field?.name || '');
  const [type, setType] = useState<'Fútbol 5' | 'Fútbol 7' | 'Fútbol 11'>(field?.type || 'Fútbol 5');
  const [pricePerHour, setPricePerHour] = useState(field?.pricePerHour?.toString() || '100000');
  const [depositPercentage, setDepositPercentage] = useState(field?.depositPercentage?.toString() || '50');
  const [dimensions, setDimensions] = useState(field?.dimensions || '20m x 30m');
  const [grassType, setGrassType] = useState(field?.grassType || 'Sintética Monofilamento 50mm');
  const [image, setImage] = useState(field?.image || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name,
        type,
        pricePerHour: parseFloat(pricePerHour),
        depositPercentage: parseFloat(depositPercentage),
        dimensions,
        grassType,
        image,
      };

      const url = isEditing ? `/api/fields/${field!.id}` : '/api/fields';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Error al guardar la cancha en la base de datos.');
      }

      onSaveSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error en el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">{isEditing ? 'Editar Cancha Sintética' : 'Crear Nueva Cancha Sintética'}</h2>
              <p className="text-[11px] text-slate-400">Configuración de cancha y precio de abono 50%</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700 max-h-[75vh] overflow-y-auto">
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Name & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-800 block mb-1">Nombre de la Cancha</label>
              <input
                type="text"
                placeholder="Ej: Cancha 1 - La Bombonera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">Tipo de Cancha</label>
              <select
                value={type}
                onChange={(e: any) => setType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="Fútbol 5">Fútbol 5</option>
                <option value="Fútbol 7">Fútbol 7</option>
                <option value="Fútbol 11">Fútbol 11</option>
              </select>
            </div>
          </div>

          {/* Pricing & Deposit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-800 block mb-1">Precio Total por Hora (COP)</label>
              <div className="relative">
                <input
                  type="number"
                  placeholder="100000"
                  value={pricePerHour}
                  onChange={(e) => setPricePerHour(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
                <DollarSign className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">% Abono Inicial Requerido</label>
              <input
                type="number"
                value={depositPercentage}
                onChange={(e) => setDepositPercentage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Dimensions & Grass */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-800 block mb-1">Dimensiones</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="20m x 30m"
                  value={dimensions}
                  onChange={(e) => setDimensions(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
                <Ruler className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-800 block mb-1">Tipo de Grama</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Sintética Monofilamento 50mm"
                  value={grassType}
                  onChange={(e) => setGrassType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  required
                />
                <Layers className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>
          </div>

          {/* Image URL & Preview */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 block">URL de Imagen de la Cancha</label>
            <div className="relative">
              <input
                type="url"
                placeholder="https://images.unsplash.com/photo-..."
                value={image}
                onChange={(e) => setImage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-8 pr-3 py-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                required
              />
              <ImageIcon className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
            </div>

            {/* Preview Box */}
            {image && (
              <div className="relative h-32 w-full rounded-xl overflow-hidden border border-slate-200 mt-2 bg-slate-900">
                <img src={image} alt="Preview" className="w-full h-full object-cover opacity-90" />
                <span className="absolute bottom-2 left-2 bg-slate-950/80 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                  Vista Previa de Tarjeta
                </span>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md text-xs mt-4 disabled:opacity-50"
          >
            {loading ? (
              <span>Guardando en Supabase...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{isEditing ? 'Guardar Cambios' : 'Crear Cancha Sintética'}</span>
              </>
            )}
          </button>

        </form>

      </div>
    </div>
  );
}
