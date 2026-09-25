import { createClient } from '@/utils/supabase/server';
import { getCurrentVisitor } from '@/utils/supabase/service';
import Navbar from '@/components/Navbar';
import { AudioProvider } from '@/context/AudioContext';
import { VisitorProvider } from '@/context/VisitorContext';
import GlobalPlayer from '@/components/GlobalPlayer';
import { VisitorNicknameDialog } from '@/components/VisitorNicknameDialog';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import './globals.css';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata = {
  title: 'Mi Emisora',
  description: 'La mejor emisora y portal de noticias',
};

export default async function RootLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Leemos la cookie del visitante en el servidor
   let visitor = null;

   try{
    visitor = await getCurrentVisitor()
   }catch(err){
      console.error("Error al obtener el visitante actual", err)
   }

const initialUsername = visitor?.visitorUid ?? null;

  const now = new Date();
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  };
  const fechaActual = now.toLocaleDateString('es-ES', options);
  const fechaFormateada = fechaActual.charAt(0).toUpperCase() + fechaActual.slice(1);

  return (
    <html lang="es" className={cn("font-sans", geist.variable)}>
      <body className="bg-slate-950 text-slate-100 min-h-screen m-0 p-0 overflow-x-hidden">
        <AudioProvider>
          {/* Envolvemos la app con el VisitorProvider pasando el initialUsername resuelto en el servidor */}
          <VisitorProvider initialUsername={initialUsername}>
            <Navbar user={user} fechaFormateada={fechaFormateada} />

            {/* Reproductor global: se mantiene visible (y sonando) al navegar entre páginas */}
            <div className="sticky top-20 z-40">
              <GlobalPlayer />
            </div>

            {/* Renderiza el contenido de la página directamente sin restricciones de contenedor global */}
            {children}
          <VisitorNicknameDialog />
          </VisitorProvider>
        </AudioProvider>
      </body>
    </html>
  );
}
