'use client';

import { useState } from "react"
import { useRouter } from 'next/navigation'
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { notify } from "./toast";
import { AuthService } from "@/services/authService"

interface LoginDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginDialog({ isOpen, onClose }: LoginDialogProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const router = useRouter()

  if (!isOpen) return null; // Si está cerrado, no renderiza nada en el DOM

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)
    setSuccessMessage(null)

    try {
      await AuthService.signInWithEmail(email, password)
      onClose() 
      notify.success("¡Inicio de sesión exitoso!")
     
      setEmail("")
      setPassword("")

      setTimeout(() => {
        router.push('/profile')
      }, 1000)

    } catch {
      notify.error("Error al iniciar sesión, comprueba tu correo o tu contraseña")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true)
      setErrorMessage(null)
      await AuthService.signInWithGoogle()
      notify.success("¡Inicio de sesión exitoso!")
      setSuccessMessage("¡Inicio de sesión exitoso!")
    } catch (error: unknown) {
      console.error("Error con Google:", error)
      notify.error("Ocurrió un problema al intentar iniciar sesión con Google")
      setErrorMessage(error instanceof Error ? error.message : "Error al conectar con Google")
      setGoogleLoading(false)
    }
  }

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
            <h2 className="text-xl font-bold text-white">Bienvenido de nuevo</h2>
            <p className="text-sm text-slate-400 mt-1">
              Ingresa tus credenciales para acceder a tu cuenta.
            </p>
          </div>
          
          <FieldGroup className="py-2 space-y-3">
            <Field>
              <Label htmlFor="email" className="text-slate-300 text-sm">Correo electrónico</Label>
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
              <Label htmlFor="password" className="text-slate-300 text-sm">Contraseña</Label>
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
            <p className="text-red-400 text-xs text-center my-2">{errorMessage}</p>
          )}

          {successMessage && (
            <p className="text-green-400 font-medium text-xs text-center my-2">{successMessage}</p>
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
              
              <Button type="submit" disabled={loading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white border-0 cursor-pointer">
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

            <div className="relative w-full my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-950 px-2 text-slate-500">O continúa con</span>
              </div>
            </div>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full flex items-center justify-center gap-2 cursor-pointer bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800 hover:text-white"
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

            <p className="text-center text-xs text-slate-400 mt-2">
              ¿No tienes una cuenta?{' '}
              <Link 
                href="/register" 
                className="font-medium text-blue-400 hover:underline"
                onClick={onClose}
              >
                Regístrate aquí
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}