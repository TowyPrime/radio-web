'use client';

import { useState } from "react";
import { useVisitor } from "@/context/VisitorContext";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { notify } from "./toast";

export function VisitorNicknameDialog() {
  const { isDialogOpen, resolveVisitor, cancelVisitor } = useVisitor();
  
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isDialogOpen) return null; 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = username.trim();
    if (!trimmedName) {
      setErrorMessage('Por favor, escribe un nickname válido.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/visitor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: trimmedName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Ocurrió un error al registrar el nickname.');
      }

      notify.success("¡Identidad guardada con éxito!");
      resolveVisitor(data.username || trimmedName);
      setUsername("");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error de conexión';
      setErrorMessage(errorMsg);
      notify.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setUsername("");
    setErrorMessage(null);
    cancelVisitor();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={handleCancel}
      />

      <div className="relative w-full max-w-sm bg-slate-950 border border-slate-800 text-white rounded-xl shadow-2xl p-6 z-10 my-auto animate-in fade-in zoom-in-95 duration-200">
        
        <button 
          type="button"
          onClick={handleCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">Elige tu apodo</h2>
            <p className="text-sm text-slate-400 mt-1">
              Necesitamos un nombre para que puedas interactuar en el sitio.
            </p>
          </div>
          
          <FieldGroup className="py-2 space-y-3">
            <Field>
              <Label htmlFor="username" className="text-slate-300 text-sm">Nickname</Label>
              <Input 
                id="username" 
                name="username" 
                type="text" 
                placeholder="Ej. MariaRadio" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                maxLength={30}
                required 
                disabled={loading}
                className="bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
              />
            </Field>
          </FieldGroup>

          {errorMessage && (
            <p className="text-red-400 text-xs text-center my-2">{errorMessage}</p>
          )}

          <div className="flex flex-col gap-3 mt-6">
            <div className="flex w-full gap-2 justify-end">
              <Button 
                variant="outline" 
                type="button" 
                onClick={handleCancel}
                disabled={loading}
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
                    <span>Guardando...</span>
                  </>
                ) : (
                  <span>Guardar y Continuar</span>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}