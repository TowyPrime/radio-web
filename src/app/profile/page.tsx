'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { userService } from '@/services/userService';
import { AuthService } from '@/services/authService';
import { useRouter } from 'next/navigation';
import { notify } from '@/components/toast';
import { LoginDialog } from '@/components/LoginDialog';

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [authUid, setAuthUid] = useState<string | null>(null);

  //Estado para controlar la visibilidad del diálogo de login
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    avatar_url: '',
  });

  // Estado para manejar el archivo de imagen seleccionado localmente
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
            notify.warning("No tienes una sesión activa")
          setIsLoginOpen(true);
          router.push('/');
          return;
        }

        setAuthUid(user.id);

        const profile = await userService.getByUid(user.id);

        if (profile) {
          setIsNewProfile(false);
          setFormData({
            username: profile.username || '',
            full_name: profile.full_name || '',
            avatar_url: profile.avatar_url || '',
          });
          if (profile.avatar_url) {
            setPreviewUrl(profile.avatar_url);
          }
        } else {
          setIsNewProfile(true);
          const meta = user.user_metadata;
          setFormData({
            username: meta?.preferred_username || meta?.user_name || '',
            full_name: meta?.full_name || meta?.name || '',
            avatar_url: meta?.avatar_url || meta?.picture || '',
          });
          if (meta?.avatar_url || meta?.picture) {
            setPreviewUrl(meta?.avatar_url || meta?.picture);
          }
        }
      } catch (error) {
        console.error('Error al cargar el perfil:', error);
        notify.error("Error al cargar el perfil")
      } finally {
        setLoading(false);
      }
    }

    loadUserProfile();
  }, [supabase, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUid) return;

    setSaving(true);
    try {
      let finalAvatarUrl = formData.avatar_url;

      // Si el usuario seleccionó un archivo nuevo, lo subimos a Supabase Storage
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${authUid}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // Subir al bucket 'images'
        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, selectedFile, { upsert: true });

        if (uploadError) {
          throw new Error(`Error al subir la imagen: ${uploadError.message}`);
        }

        // Obtener la URL pública del archivo recién subido
        const { data: publicData } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        finalAvatarUrl = publicData.publicUrl;
        console.log(finalAvatarUrl)
      }

      // Guardar o actualizar el perfil con la URL final del avatar
      if (isNewProfile) {
        await userService.createProfile({
          uid: authUid,
          username: formData.username,
          full_name: formData.full_name,
          avatar_url: finalAvatarUrl ? finalAvatarUrl : null,
          isFirstLogin: true,
        });
        setIsNewProfile(false);
        notify.success("¡Perfil creado exitosamente!");
        console.log('¡Perfil creado exitosamente!');
      } else {
        await userService.updateProfile(authUid, {
          username: formData.username,
          full_name: formData.full_name,
          avatar_url: finalAvatarUrl ? finalAvatarUrl : null,
        });
        notify.success("¡Cambios guardados correctamente!");
        console.log('¡Cambios guardados correctamente!');
      }

      // Actualizar el estado local con la URL definitiva
      setFormData(prev => ({ ...prev, avatar_url: finalAvatarUrl }));
      setSelectedFile(null); // Limpiar el archivo seleccionado

    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : '';
      console.error(`Error al guardar: ${message}`);
      notify.error(message || "¡Ocurrió un error al intentar guardar los cambios!");
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await AuthService.signOut();
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      notify.error("No se pudo cerrar la sesión")
      return;
    }
    notify.success("Se cerró la sesión correctamente")

    router.refresh();

    setTimeout(()=>{
      router.push('/')
    }, 1000)
  };

  const handleChangePassword = () => {
    //TODO: Crear el dialogo para cambiar la contraseña o redirigir a una página de cambio de contraseña
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '¿Estás seguro de que deseas borrar tu cuenta? Esta acción no se puede deshacer.'
    );
    if (!confirmed) return;

    try {
      // Borra el perfil y el usuario de Auth en el servidor, y cierra la sesión
      await AuthService.deleteAccount();
      notify.success("Tu cuenta ha sido eliminada correctamente")

      router.push('/');
      router.refresh();
    } catch (error: unknown) {
      console.error('Error al eliminar la cuenta:', error);
      notify.error("¡Ocurrió un error al intentar eliminar la cuenta!")
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <p className="text-white text-lg">Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-slate-900 rounded-lg shadow-lg border border-slate-800">
      <h1 className="text-2xl font-bold text-white mb-2">
        {isNewProfile ? 'Completa tu perfil' : 'Esta es la página del perfil del usuario'}
      </h1>
      <p className="text-slate-400 text-sm mb-6">
        {isNewProfile 
          ? 'Es tu primera vez por aquí. Por favor, define tu nombre de usuario único y tus datos.' 
          : 'Aquí puedes actualizar la información de tu cuenta.'}
      </p>

      {/* Contenedor Principal en 2 columnas grandes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {/* Columna Izquierda (Ocupa 2 espacios): Avatar + Formulario */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Recuadro de Previsualización del Avatar */}
          <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 flex items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700 flex items-center justify-center shrink-0">
              {previewUrl ? (
                <img 
                  src={previewUrl} 
                  alt="Avatar preview"
                  loading="eager" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-14 h-14 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Tu Avatar
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                {previewUrl ? 'Imagen lista para actualizarse.' : 'Modo anónimo activado. Selecciona una imagen abajo.'}
              </p>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">Nombre de usuario (Único)</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded mt-1 focus:outline-none focus:border-blue-500"
                placeholder="ej. angel_dev"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300">Nombre completo</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 text-white p-2 rounded mt-1 focus:outline-none focus:border-blue-500"
                placeholder="Tu nombre completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">
                Subir nueva imagen de Avatar <span className="text-slate-500">(opcional)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-white hover:file:bg-slate-700 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium p-2 rounded transition-colors disabled:opacity-50"
            >
              {saving ? 'Guardando...' : isNewProfile ? 'Crear Perfil' : 'Guardar Cambios'}
            </button>
          </form>

        </div>

        {/* Columna Derecha: Botones de gestión de cuenta */}
        <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 space-y-3 md:col-span-1">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Gestión de Cuenta
          </h3>
          
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium py-2 px-3 rounded transition-colors text-left flex items-center justify-between"
          >
            <span>Cerrar sesión</span>
            <span>🚪</span>
          </button>

          <button
            type="button"
            onClick={handleChangePassword}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium py-2 px-3 rounded transition-colors text-left flex items-center justify-between"
          >
            <span>Cambiar contraseña</span>
            <span>🔑</span>
          </button>

          <button
            type="button"
            onClick={handleDeleteAccount}
            className="w-full bg-red-900/40 hover:bg-red-900/70 text-red-200 text-sm font-medium py-2 px-3 rounded border border-red-800/50 transition-colors text-left flex items-center justify-between"
          >
            <span>Borrar cuenta</span>
            <span>⚠️</span>
          </button>
        </div>

      </div>

      {/*Renderizamos el LoginDialog controlando su estado de apertura y cierre */}
      <LoginDialog 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
      />
    </div>
  );
}