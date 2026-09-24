'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Mail, User, LogIn, Video, Music, ListPlus, LogOut } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { userService } from '@/services/userService';
import { AuthService } from '@/services/authService';

interface NavbarProps {
  user: SupabaseUser | null;
  fechaFormateada: string;
  onLogoClick?: () => void;
  onNewsClick?: () => void;
  onContactClick?: () => void;
  onAuthClick?: () => void;
  onLogout?: () => void;
}

export default function Navbar({ 
  user, 
  fechaFormateada, 
  onLogoClick,
  onNewsClick, 
  onContactClick, 
  onAuthClick,
  onLogout 
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Comprobar si el usuario actual es administrador consultando la tabla profiles
  useEffect(() => {
    async function checkAdminRole() {
      if (user?.id) {
        try {
          const adminStatus = await userService.isAdmin(user.id);
          setIsAdmin(adminStatus);
        } catch (error) {
          console.error("Error al verificar el rol de administrador:", error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    }

    checkAdminRole();
  }, [user]);

  // Cerrar el menú si se hace clic fuera de él
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-slate-950 backdrop-blur sticky top-0 z-50 w-full">
      <div className="w-full px-4 h-20 flex items-center justify-between gap-4">
        
        {/* Logo y Noticias */}
        <div className="flex items-center gap-6">
          <Link 
            href="/" 
            onClick={onLogoClick}
            className="flex items-center gap-2 group cursor-pointer focus:outline-none"
            title="Ir al inicio"
          >
            <Image 
              src="/logo.svg"
              alt="Logo de la empresa"
              width={40}
              height={40}
              unoptimized
              className="rounded-full object-cover border border-slate-700 group-hover:border-blue-500 transition-colors"
            />
          </Link>
          
          <Link 
            href="/news" 
            onClick={onNewsClick}
            className="text-slate-300 hover:text-white transition-colors font-medium text-sm md:text-base cursor-pointer"
          >
            Noticias
          </Link>

          <Link
            href="/live"
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors font-medium text-sm md:text-base cursor-pointer"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            En vivo
          </Link>
        </div>

        {/* Buscador */}
        <div className="hidden md:flex items-center relative w-64">
          <Search className="absolute left-3 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar en la página..." 
            className="w-full bg-slate-800 border border-slate-700 rounded-full pl-9 pr-4 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Fecha */}
        <div className="hidden lg:block text-center text-sm font-medium text-slate-400 bg-slate-800/40 px-4 py-1.5 rounded-full border border-slate-800">
          {fechaFormateada}
        </div>

        {/* Contacto y Perfil/Acceso */}
        <div className="flex items-center gap-6">
          <Link 
            href="/contact" 
            onClick={onContactClick}
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors text-sm font-medium cursor-pointer"
          >
            <Mail className="w-4 h-4 text-blue-400" />
            <span className="hidden sm:inline">Contacto</span>
          </Link>

          <div>
            {user ? (
              <div className="relative" ref={menuRef}>
                {/* Botón del perfil que despliega el menú */}
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 group cursor-pointer focus:outline-none"
                  aria-expanded={isMenuOpen}
                >
                  {user.user_metadata?.avatar_url ? (
                    <Image 
                      src={user.user_metadata.avatar_url} 
                      alt="Avatar" 
                      width={36} 
                      height={36} 
                      className="rounded-full border border-slate-700 group-hover:border-blue-500 transition-colors object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm border border-slate-700">
                      {user.email?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                    </div>
                  )}
                </button>

                {/* Popup Menú */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-2 z-50 text-slate-200">
                    
                    <div className="px-4 py-2 border-b border-slate-800 mb-1">
                      <p className="text-xs text-slate-400 truncate">Conectado como</p>
                      <p className="text-sm font-medium text-white truncate">{user.email}</p>
                    </div>

                    {/* Opción 1: Ver Perfil */}
                    <Link 
                      href="/profile" 
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-800 transition-colors"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Ver Perfil</span>
                    </Link>

                    {/* Opciones exclusivas para Administradores basados en la tabla profiles */}
                    {isAdmin && (
                      <>
                        <div className="my-1 border-t border-slate-800"></div>
                        <div className="px-4 py-1 text-[10px] uppercase font-bold tracking-wider text-blue-400">Panel Admin</div>
                        
                        <Link 
                          href="/live/start" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-800 transition-colors"
                        >
                          <Video className="w-4 h-4 text-blue-400" />
                          <span>Iniciar live</span>
                        </Link>

                        <Link 
                          href="/music/save" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-800 transition-colors"
                        >
                          <Music className="w-4 h-4 text-blue-400" />
                          <span>Guardar música</span>
                        </Link>

                        <Link 
                          href="/playlist/create" 
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-800 transition-colors"
                        >
                          <ListPlus className="w-4 h-4 text-blue-400" />
                          <span>Crear playlist</span>
                        </Link>
                      </>
                    )}

                    <div className="my-1 border-t border-slate-800"></div>

                    {/* Opción: Cerrar sesión */}
                    <button 
                      onClick={async () => {
                        setIsMenuOpen(false);
                        if (onLogout) {
                          onLogout();
                          return;
                        }
                        await AuthService.signOut();
                        router.push('/');
                        router.refresh();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar sesión</span>
                    </button>

                  </div>
                )}
              </div>
            ) : (
              <Link 
                href="/login"
                onClick={onAuthClick}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Acceder</span>
              </Link>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}