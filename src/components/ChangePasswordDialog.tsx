"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { notify } from "./toast";
import { createClient } from "@/utils/supabase/client";
interface ChangePasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordDialog({
  isOpen,
  onClose,
}: ChangePasswordDialogProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  if (!isOpen) return null;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. Validar que coincidan
    if (newPassword !== confirmPassword) {
      const msg = "Las contraseñas no coinciden.";
      setErrorMessage(msg);
      notify.error(msg);
      setLoading(false);
      return;
    }

    // 2. Validar requerimientos de seguridad por Regex
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!\%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      const msg = "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial.";
      setErrorMessage(msg);
      notify.error(msg);
      setLoading(false);
      return;
    }

    try {
      const supabase = await createClient();

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setErrorMessage(error.message);
        notify.error(`Error al cambiar la contraseña: ${error.message}`);
        setLoading(false);
        return;
      }

      const successText = "Contraseña cambiada con éxito";
      setSuccessMessage(successText);
      notify.success(successText);

      setTimeout(() => {
        setNewPassword("");
        setConfirmPassword("");
        onClose();
        router.refresh();
      }, 1500);

    } catch (error: unknown) {
      console.error("Error al cambiar la contraseña: ", error);
      const msg = error instanceof Error ? error.message : "Error desconocido";
      setErrorMessage(msg);
      notify.error(`Error al cambiar la contraseña: ${msg}`);
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

      {/* Contenido del Modal */}
      <div className="relative w-full max-w-sm bg-slate-950 border border-slate-800 text-white rounded-xl shadow-2xl p-6 z-10 my-auto animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleChangePassword}>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">
              Cambiar contraseña
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Ingresa tu nueva contraseña.
            </p>
          </div>

          <FieldGroup className="py-2 space-y-3">
            <Field>
              <Label htmlFor="password" className="text-slate-300 text-sm">
                Contraseña
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
              />
            </Field>
            <Field>
              <Label htmlFor="confirmPassword" className="text-slate-300 text-sm">
                Confirmar contraseña
              </Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                    <span>Cambiando...</span>
                  </>
                ) : (
                  <span>Cambiar contraseña</span>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}