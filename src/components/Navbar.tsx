"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Mail,
  User,
  LogIn,
  Video,
  Music,
  ListPlus,
  LogOut,
  Newspaper,
  CalendarClock,
} from "lucide-react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { userService } from "@/services/userService";
import { AuthService } from "@/services/authService";

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
  onLogout,
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
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-ink-950 backdrop-blur sticky top-0 z-50 w-full">
      <div className="w-full px-4 h-20 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo y Noticias */}
        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/"
            onClick={onLogoClick}
            className="flex shrink-0 items-center gap-2 group cursor-pointer focus:outline-none"
            title="Ir al inicio"
          >
            <Image
              src="/icon.jpg"
              alt="Logo de la empresa"
              width={40}
              height={40}
              unoptimized
              className="w-10 h-10 rounded-full object-cover border border-ink-700 group-hover:border-brand-400 transition-colors"
            />
          </Link>

          <Link
            href="/"
            onClick={onNewsClick}
            className="whitespace-nowrap text-ink-300 hover:text-white transition-colors font-medium text-sm md:text-base cursor-pointer"
          >
            Noticias
          </Link>

          <Link
            href="/live"
            className="flex items-center gap-2 whitespace-nowrap text-ink-300 hover:text-white transition-colors font-medium text-sm md:text-base cursor-pointer"
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
          <Search className="absolute left-3 w-4 h-4 text-ink-400" />
          <input
            type="text"
            placeholder="Buscar en la página..."
            className="w-full bg-ink-800 border border-ink-700 rounded-full pl-9 pr-4 py-1.5 text-sm text-white placeholder-ink-400 focus:outline-none focus:border-brand-400 transition-colors"
          />
        </div>

        {/* Fecha */}
        <div className="hidden lg:block text-center text-sm font-medium text-ink-400 bg-ink-800/40 px-4 py-1.5 rounded-full border border-ink-800">
          {fechaFormateada}
        </div>

        {/* Contacto y Perfil/Acceso */}
        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/contact"
            onClick={onContactClick}
            className="flex items-center gap-2 text-ink-300 hover:text-white transition-colors text-sm font-medium cursor-pointer"
          >
            <Mail className="w-4 h-4 text-brand-400" />
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
                      className="rounded-full border border-ink-700 group-hover:border-brand-400 transition-colors object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-brand-700 flex items-center justify-center text-white font-bold text-sm border border-ink-700">
                      {user.email?.charAt(0).toUpperCase() || (
                        <User className="w-4 h-4" />
                      )}
                    </div>
                  )}
                </button>

                {/* Popup Menú */}
                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-ink-900 border border-ink-700 rounded-xl shadow-xl py-2 z-50 text-ink-200">
                    <div className="px-4 py-2 border-b border-ink-800 mb-1">
                      <p className="text-xs text-ink-400 truncate">
                        Conectado como
                      </p>
                      <p className="text-sm font-medium text-white truncate">
                        {user.email}
                      </p>
                    </div>

                    {/* Opción 1: Ver Perfil */}
                    <Link
                      href="/profile"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-ink-800 transition-colors"
                    >
                      <User className="w-4 h-4 text-ink-400" />
                      <span>Ver Perfil</span>
                    </Link>

                    {/* Opciones exclusivas para Administradores basados en la tabla profiles */}
                    {isAdmin && (
                      <>
                        <div className="my-1 border-t border-ink-800"></div>
                        <div className="px-4 py-1 text-[10px] uppercase font-bold tracking-wider text-brand-400">
                          Panel Admin
                        </div>

                        <a
                          href="https://studio.youtube.com"
                          onClick={() => setIsMenuOpen(false)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-ink-800 transition-colors"
                        >
                          <Video className="w-4 h-4 text-brand-400" />
                          <span>Iniciar live</span>
                        </a>

                        <Link
                          href="/music/save"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-ink-800 transition-colors"
                        >
                          <Music className="w-4 h-4 text-brand-400" />
                          <span>Guardar música</span>
                        </Link>

                        <Link
                          href="/playlist/create"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-ink-800 transition-colors"
                        >
                          <ListPlus className="w-4 h-4 text-brand-400" />
                          <span>Crear playlist</span>
                        </Link>
                        <Link
                        href="/admin/schedule"
                        onClick={( ) => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-ink-800 transition-colors"
                        >
                          <CalendarClock className="w-4 h-4 text-brand-400" />
                          Crear Horario
                        </Link>
                        <Link
                          href="/admin/news"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-ink-800 transition-colors"
                        >
                          <Newspaper className="w-4 h-4 text-brand-400"/>
                          <span>Crear noticia</span>
                        </Link>
                      </>
                    )}

                    <div className="my-1 border-t border-ink-800"></div>

                    {/* Opción: Cerrar sesión */}
                    <button
                      onClick={async () => {
                        setIsMenuOpen(false);
                        if (onLogout) {
                          onLogout();
                          return;
                        }
                        await AuthService.signOut();
                        router.push("/");
                        router.refresh();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-ink-800 transition-colors text-left"
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
                aria-label="Acceder"
                className="flex items-center gap-2 bg-brand-700 hover:bg-brand-800 text-white px-3 min-[360px]:px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                {/* En pantallas muy estrechas (< 360px) solo se muestra el icono */}
                <span className="hidden min-[360px]:inline">Acceder</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
