'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, LayoutDashboard, Trophy, LogOut, UserCheck } from 'lucide-react';
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
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-3">
          
          {/* Logo & Brand Identity */}
          <Link href={user ? '/admin' : '/'} className="flex items-center gap-2 sm:gap-2.5 group shrink min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md group-hover:bg-emerald-500 transition-colors shrink-0">
              <Trophy className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <span className="font-bold text-sm sm:text-lg text-white tracking-tight flex items-center gap-1 leading-tight">
                Sintética<span className="text-emerald-400">Pay</span>
              </span>
              <span className="text-[10px] sm:text-xs text-slate-400 hidden xs:block font-normal truncate max-w-[130px] sm:max-w-none">
                {user ? 'Panel Administrador' : 'Gestión de Canchas & Abono 50%'}
              </span>
            </div>
          </Link>

          {/* Right Section: Admin Controls vs Customer Badges */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {user ? (
              // ADMIN NAVBAR: Panel Link & Logout
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Link
                  href="/admin"
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                    pathname === '/admin'
                      ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-800/80'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                  <span className="hidden xs:inline sm:hidden">Panel</span>
                  <span className="hidden sm:inline">Panel Dueño</span>
                </Link>

                <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-800/90 border border-slate-700/80 pl-2 sm:pl-3 pr-1 py-1 rounded-full shadow-sm">
                  <span className="text-[11px] text-emerald-400 font-semibold max-w-[130px] truncate hidden md:inline">
                    {user.email}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-slate-700 hover:bg-red-600 text-white p-1.5 rounded-full transition-colors flex items-center gap-1 px-2 sm:px-2.5 text-xs font-medium"
                    title="Cerrar Sesión"
                  >
                    <span className="hidden sm:inline">Salir</span>
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              // CUSTOMER NAVBAR: Clean Badges & Owner Login Link
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden sm:flex items-center gap-1.5 text-xs bg-slate-800/80 border border-slate-700/60 px-3.5 py-1.5 rounded-full text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Abono 50% Online / 50% en Sitio</span>
                </div>

                <Link
                  href="/login"
                  className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 px-3 sm:px-3.5 py-1.5 rounded-full font-semibold transition-all shadow-sm"
                  title="Acceso Administrador"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Acceso Dueño</span>
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
}
