'use client';

import { useState } from "react";
import { useRouter } from 'next/navigation';
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


        </form>
      </div>
    </main>
  );
}