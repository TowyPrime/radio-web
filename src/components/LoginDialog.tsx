"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { notify } from "./toast";
import { AuthService } from "@/services/authService";

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginDialog({ isOpen, onClose }: LoginDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen) return null; // Si está cerrado, no renderiza nada en el DOM

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await AuthService.signInWithEmail(email, password);
      onClose();
      notify.success("¡Inicio de sesión exitoso!");

      setEmail("");
      setPassword("");

      setTimeout(() => {
        router.push("/profile");
      }, 1000);
    } catch {
      notify.error(
        "Error al iniciar sesión, comprueba tu correo o tu contraseña",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Fondo oscuro traslúcido */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Contenido del Modal por encima de todo (z-50) */}
      <div className="relative w-full max-w-sm bg-slate-950 border border-slate-800 text-white rounded-xl shadow-2xl p-6 z-10 my-auto animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">
              Bienvenido de nuevo
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Ingresa tus credenciales para acceder a tu cuenta.
            </p>
          </div>

          <FieldGroup className="py-2 space-y-3">
            <Field>
              <Label htmlFor="email" className="text-slate-300 text-sm">
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
                className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
              />
            </Field>
            <Field>
              <Label htmlFor="password" className="text-slate-300 text-sm">
                Contraseña
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
              />
            </Field>
          </FieldGroup>

          {errorMessage && (
            <p className="text-red-400 text-xs text-center my-2">
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p className="text-green-400 font-medium text-xs text-center my-2">
              {successMessage}
            </p>
          )}

          <div className="flex flex-col gap-3 mt-6">
            <div className="flex w-full gap-2 justify-end">
              <Button
                variant="outline"
                type="button"
                onClick={onClose}
                className="bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer"
              >
                Cancelar
              </Button>

              <Button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0 cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Entrando...</span>
                  </>
                ) : (
                  <span>Entrar</span>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
