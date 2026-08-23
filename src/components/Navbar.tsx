'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Calendar, ShieldCheck, LayoutDashboard, Trophy, LogOut } from 'lucide-react';
import { User } from '@supabase/supabase-js';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="bg-slate-900 text-slate-100 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand Identity */}
          <Link href={user ? '/admin' : '/'} className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md group-hover:bg-emerald-500 transition-colors">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                Sintética<span className="text-emerald-400">Pay</span>
              </span>
              <span className="text-xs text-slate-400 block -mt-1 font-normal">
                {user ? 'Panel Privado de Administrador' : 'Gestión de Canchas & Abono 50%'}
              </span>
            </div>
          </Link>

          {/* Navigation Links - Tailored for Admin vs Customer */}
          <nav className="flex items-center gap-2 sm:gap-4">
            {user ? (
              // ADMIN NAVBAR: Only Dashboard link, no "Reservar Cancha"
              <Link
                href="/admin"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-all ${
                  pathname === '/admin'
                    ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-800/80'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Panel de Control (Caja & Canchas)</span>
              </Link>
            ) : (
              // CUSTOMER NAVBAR: Only Public Booking link
              <Link
                href="/"
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-bold transition-all ${
                  pathname === '/'
                    ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-800/80'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Reservar Cancha</span>
              </Link>
            )}
          </nav>

          {/* Right Section: Admin Profile/Logout vs Customer Badge */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 bg-slate-800/90 border border-slate-700/80 pl-3.5 pr-2 py-1.5 rounded-full shadow-sm">
                <span className="text-xs text-emerald-400 font-semibold max-w-[150px] truncate hidden sm:inline">
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  className="bg-slate-700 hover:bg-red-600 text-white p-1.5 rounded-full transition-colors flex items-center gap-1.5 px-3"
                  title="Cerrar Sesión"
                >
                  <span className="text-xs font-medium hidden md:inline">Salir</span>
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2 text-xs bg-slate-800/80 border border-slate-700/60 px-3.5 py-1.5 rounded-full text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Abono 50% Online / 50% en Sitio</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
