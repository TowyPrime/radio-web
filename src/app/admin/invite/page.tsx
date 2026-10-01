"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { notify } from "@/components/toast";

export default function InvitePage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/admin/invite", {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ocurrió un error al enviar la invitación");
      }

      notify.success("Invitación enviada correctamente");
      setEmail(""); // Limpiar campo al tener éxito

    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage("Ocurrió un error desconocido");
      }
    } finally {
      setLoading(false);
    }
  }; // <-- Aquí cierra correctamente handleInvite

  return (
    <main className="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4 bg-slate-950">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl p-8">

        {/* Cabecera del formulario */}
        <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white">Enviar invitación de usuario</h1>
            <p className="text-sm text-slate-400 mt-1">
                Ingrese el correo electrónico de la persona que quiera invitar como usuario
            </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleInvite} className="space-y-4">
          <FieldGroup className="space-y-4">
              <Field>
                  <Label htmlFor="email" className="text-slate-300 text-sm font-medium">
                      Correo electrónico
                  </Label>
                  <Input
                    id="email" 
                    name="email" 
                    type="email" 
                    placeholder="su@correo.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                    className="mt-1 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600 focus-visible:ring-blue-500"
                  />
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
                    <span>Enviando...</span>
                  </div>
              ) : (
                    <span>Enviar</span>
              )}
          </Button>
        </form>
      </div>
    </main>
  );
}