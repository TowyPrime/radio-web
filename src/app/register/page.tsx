'use client';

import { useState } from "react";
import { useRouter } from 'next/navigation';
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import { notify } from "@/components/toast";
import { AuthService } from "@/services/authService";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  // Lógica de registro
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
     notify.error("Por favor, completa todos los campos.")
      return;
    }

    // Validación de contraseñas coinciden
    if (password !== confirmPassword) {
     notify.error("Las contraseñas no coinciden.")
      return;
    }

    if(!/[A-Z]/.test(password)){
        notify.error("La contraseña debe tener al menos una letra mayuscula")
        return;
    }

    if(!/[0-9]/.test(password)){
      notify.error("La contraseña debe contener al menos un número")
      return;
    }

    if(!/[^A-Za-z0-9]/.test(password)){
      notify.error("La contraseña debe contener al menos un caracter especial")
      return;
    }

    if (password.length < 6) {
      notify.error("La contraseña debe tener al menos 6 caracteres.")
      return;
    }
    

    setLoading(true);

    try {
      await AuthService.signUpWithEmail(email, password);
      
      notify.success("¡Registro exitoso! Por favor verifica tu correo.");
      
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        router.push('/login');
      }, 1500);

    } catch (error: unknown) {
      console.error("Error al registrarse:", error);
      notify.error("Ocurrió un error al intentar registrar la cuenta.");
      setErrorMessage(error instanceof Error ? error.message : "Error al crear la cuenta. Inténtalo de nuevo.");
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
            <UserPlus className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white">Crear una cuenta</h1>
          <p className="text-sm text-slate-400 mt-1">
            Ingresa tus datos para registrarte en la plataforma.
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <FieldGroup className="space-y-4">
            
            {/* Correo electrónico */}
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

            {/* Contraseña */}
            <Field>
              <Label htmlFor="password" className="text-slate-300 text-sm font-medium">
                Contraseña
              </Label>
              <div className="relative mt-1">
                <Input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="contraseña" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                  title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            {/* Repetir Contraseña */}
            <Field>
              <Label htmlFor="confirmPassword" className="text-slate-300 text-sm font-medium">
                Repetir contraseña
              </Label>
              <div className="relative mt-1">
                <Input 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="confirma contraseña" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required 
                  className="bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-blue-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors cursor-pointer"
                  tabIndex={-1}
                  title={showConfirmPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                <span>Registrando...</span>
              </div>
            ) : (
              <span>Registrarse</span>
            )}
          </Button>

          <p className="text-center text-xs text-slate-400 mt-6">
            ¿Ya tienes una cuenta?{' '}
            <Link 
              href="/login" 
              className="font-medium text-blue-400 hover:underline"
            >
              Inicia sesión aquí
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}