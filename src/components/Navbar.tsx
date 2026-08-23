'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, ShieldCheck, LayoutDashboard, Ticket, Trophy } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md group-hover:bg-emerald-500 transition-colors">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                Sintética<span className="text-emerald-400">Pay</span>
              </span>
              <span className="text-xs text-slate-400 block -mt-1 font-normal">
                Gestión de Canchas & Abono 50%
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === '/'
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Reservar Cancha</span>
            </Link>

            <Link
              href="/admin"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                pathname === '/admin'
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Panel Dueño (Caja)</span>
            </Link>
          </nav>

          {/* Badge SaaS Mode */}
          <div className="hidden md:flex items-center gap-2 text-xs bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-full text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sistema 50% Online / 50% Sitio</span>
          </div>

        </div>
      </div>
    </header>
  );
}
