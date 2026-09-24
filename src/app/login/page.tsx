'use client';

import { useState } from "react";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { notify } from "@/components/toast";
import { AuthService } from "@/services/authService";
import { userService } from "@/services/userService";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // Estado para mostrar/ocultar
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();


  // Lógica de inicio de sesión tradicional
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
  

    try {
      const authResponse = await AuthService.signInWithEmail(email, password);
      const userId = authResponse.user.id;

      notify.success("¡Inicio de sesión exitoso!");

      setEmail("");
      setPassword("");

      // Si el usuario todavía no tiene perfil, lo mandamos a completarlo
      let hasProfile = false;
      try {
        hasProfile = (await userService.getByUid(userId)) !== null;
      } catch (profileError) {
        console.error("Error al consultar el perfil:", profileError);
      }

      setTimeout(() => {
        router.push(hasProfile ? '/' : '/profile');
        router.refresh();
      }, 500);

    } catch (error: unknown) {
      console.error("Error al iniciar sesión:", error);
      notify.error("Error al iniciar sesión, comprueba tus credenciales.");
      setErrorMessage("Correo o contraseña incorrectos.");
    } finally {
      setLoading(false);
    }
  };

  // Lógica de inicio de sesión con Google
  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setErrorMessage(null);
      
      await AuthService.signInWithGoogle();
      notify.success("¡Inicio de sesión exitoso con Google!");
      
    } catch (error: unknown) {
      console.error("Error con Google:", error);
      notify.error("Ocurrió un problema al intentar iniciar sesión con Google.");
      setErrorMessage(error instanceof Error ? error.message : "Error al conectar con Google.");
      setGoogleLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl p-8">
        
        {/* Cabecera del formulario */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-600/10 text-blue-400 mb-3 border border-blue-500/20">
            <LogIn className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">Bienvenido de nuevo</h1>
          <p className="text-sm text-slate-400 mt-1">
            Ingresa tus credenciales para acceder a tu cuenta.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <FieldGroup className="space-y-4">
            <Field>
              <Label htmlFor="email" className="text-slate-300 text-sm font-medium">
                Correo electrónico
              </Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                placeholder="tu@correo.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="mt-1 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-blue-500"
              />
            </Field>

            <Field>
              <Label htmlFor="password" className="text-slate-300 text-sm font-medium">
                Contraseña
              </Label>
              {/* Contenedor relativo para posicionar el icono */}
              <div className="relative mt-1">
                <Input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"} // Cambia dinámicamente el tipo
                  placeholder="contraseña" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 pr-10" // Añadimos pr-10 para dejar espacio al icono
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1} // Evita que se enfoque con la tecla Tab de forma molesta
                  title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </Field>
          </FieldGroup>

          {errorMessage && (
            <p className="text-red-400 text-xs text-center bg-red-950/30 border border-red-900/50 p-2 rounded-lg">
              {errorMessage}
            </p>
          )}

          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-xl transition-colors cursor-pointer border-0"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Entrando...</span>
              </div>
            ) : (
              <span>Entrar</span>
            )}
          </Button>

          <div className="relative w-full my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-500">O continúa con</span>
            </div>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2 cursor-pointer bg-slate-950 border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white py-2 rounded-xl transition-colors"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c-.07-.7-.63-1.27-1.345-1.27H12v4.74h6.53c-.3 1.54-1.6 4.02-4.53 4.02-2.73 0-4.97-2.26-4.97-5.03s2.24-5.03 4.97-5.03c1.55 0 2.91.6 3.91 1.57l3.52-3.51C19.7 6.49 16.14 5 12 5 6.48 5 2 9.48 2 15s4.48 10 10 10c5.77 0 9.6-4.06 9.6-9.77 0-.67-.07-1.3-.155-1.96z"/>
              <path fill="#34A853" d="M12 25c3.24 0 5.95-1.08 7.93-2.91l-3.72-3.04c-1.08.74-2.47 1.25-4.21 1.25-2.93 0-4.23-2.48-4.53-4.02H3.39v3.15C5.3 22.56 8.37 25 12 25z"/>
              <path fill="#FBBC05" d="M7.47 16.28c-.16-.5-.25-1.03-.25-1.58s.09-1.08.25-1.58V9.97H3.39C2.75 11.24 2.4 12.69 2.4 14.25s.35 3.01.99 4.28l4.08-3.15z"/>
              <path fill="#EA4335" d="M12 9.02c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 5.41 15.24 4.3 12 4.3 8.37 4.3 5.3 6.74 3.39 9.97l4.08 3.15c.3-1.54 1.6-4.1 4.53-4.1z"/>
            </svg>
            {googleLoading ? "Conectando..." : "Google"}
          </Button>

          <p className="text-center text-xs text-slate-400 mt-6">
            ¿No tienes una cuenta?{' '}
            <Link 
              href="/register" 
              className="font-medium text-blue-400 hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}