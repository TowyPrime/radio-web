'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/utils/supabase/client';
import { userService } from '@/services/userService';
import { AuthService } from '@/services/authService';
import { useRouter } from 'next/navigation';
import { notify } from '@/components/toast';
import { LoginDialog } from '@/components/LoginDialog';
import ChangePasswordDialog from '@/components/ChangePasswordDialog';

export default function ProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNewProfile, setIsNewProfile] = useState(false);
  const [authUid, setAuthUid] = useState<string | null>(null);

  // Estado para controlar la visibilidad del diálogo de login
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Estado para manejar diálogo de cambio de contraseña
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

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
          notify.warning("No tienes una sesión activa");
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
        notify.error("Error al cargar el perfil");
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

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${authUid}-${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('images')
          .upload(filePath, selectedFile, { upsert: true });

        if (uploadError) {
          throw new Error(`Error al subir la imagen: ${uploadError.message}`);
        }

        const { data: publicData } = supabase.storage
          .from('images')
          .getPublicUrl(filePath);

        finalAvatarUrl = publicData.publicUrl;
      }

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
      } else {
        await userService.updateProfile(authUid, {
          username: formData.username,
          full_name: formData.full_name,
          avatar_url: finalAvatarUrl ? finalAvatarUrl : null,
        });
        notify.success("¡Cambios guardados correctamente!");
      }

      setFormData(prev => ({ ...prev, avatar_url: finalAvatarUrl }));
      setSelectedFile(null);

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
      notify.error("No se pudo cerrar la sesión");
      return;
    }
    notify.success("Se cerró la sesión correctamente");

    router.refresh();

    setTimeout(() => {
      router.push('/');
    }, 1000);
  };

  const handleChangePassword = () => {
    setIsChangePasswordOpen(true);
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      '¿Estás seguro de que deseas borrar tu cuenta? Esta acción no se puede deshacer.'
    );
    if (!confirmed) return;

    try {
      await AuthService.deleteAccount();
      notify.success("Tu cuenta ha sido eliminada correctamente");

      router.push('/');
      router.refresh();
    } catch (error: unknown) {
      console.error('Error al eliminar la cuenta:', error);
      notify.error("¡Ocurrió un error al intentar eliminar la cuenta!");
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
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-ink-900 rounded-lg shadow-lg border border-ink-800">
      <h1 className="text-2xl font-bold text-white mb-2">
        {isNewProfile ? 'Completa tu perfil' : 'Esta es la página del perfil del usuario'}
      </h1>
      <p className="text-ink-400 text-sm mb-6">
        {isNewProfile 
          ? 'Es tu primera vez por aquí. Por favor, define tu nombre de usuario único y tus datos.' 
          : 'Aquí puedes actualizar la información de tu cuenta.'}
      </p>

      {/* Contenedor Principal en 2 columnas grandes */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        
        {/* Columna Izquierda: Avatar + Formulario */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-ink-800/50 p-4 rounded-lg border border-ink-700/50 flex items-center gap-6">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-ink-800 border-2 border-ink-700 flex items-center justify-center shrink-0">
              {previewUrl ? (
                // Avatar de 96px: puede ser una vista previa local (blob:) o venir de otro
                // dominio (Google, Supabase), así que no se optimiza
                <Image
                  src={previewUrl}
                  alt="Avatar preview"
                  fill
                  unoptimized
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <svg className="w-14 h-14 text-ink-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              )}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink-300 uppercase tracking-wider mb-1">
                Tu Avatar
              </h3>
              <p className="text-xs text-ink-400 mb-3">
                {previewUrl ? 'Imagen lista para actualizarse.' : 'Modo anónimo activado. Selecciona una imagen abajo.'}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="profile-username" className="text-ink-300">Nombre de usuario (Único)</Label>
              <Input
                id="profile-username"
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="mt-1"
                placeholder="ej. angel_dev"
              />
            </div>

            <div>
              <Label htmlFor="profile-fullname" className="text-ink-300">Nombre completo</Label>
              <Input
                id="profile-fullname"
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="mt-1"
                placeholder="Tu nombre completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-ink-300 mb-1">
                Subir nueva imagen de Avatar <span className="text-ink-500">(opcional)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-sm text-ink-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-ink-800 file:text-white hover:file:bg-ink-700 cursor-pointer"
              />
            </div>

            <Button type="submit" size="md" disabled={saving} className="w-full">
              {saving ? 'Guardando...' : isNewProfile ? 'Crear Perfil' : 'Guardar Cambios'}
            </Button>
          </form>

        </div>

        {/* Columna Derecha: Botones de gestión de cuenta */}
        <div className="bg-ink-800/50 p-4 rounded-lg border border-ink-700/50 space-y-3 md:col-span-1">
          <h3 className="text-sm font-semibold text-ink-300 uppercase tracking-wider mb-2">
            Gestión de Cuenta
          </h3>
          
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleSignOut}
            className="w-full justify-between"
          >
            <span>Cerrar sesión</span>
            <span aria-hidden="true">🚪</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleChangePassword}
            className="w-full justify-between"
          >
            <span>Cambiar contraseña</span>
            <span aria-hidden="true">🔑</span>
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="md"
            onClick={handleDeleteAccount}
            className="w-full justify-between"
          >
            <span>Borrar cuenta</span>
            <span aria-hidden="true">⚠️</span>
          </Button>
        </div>

      </div>

      {/* Renderizamos el LoginDialog */}
      <LoginDialog 
        isOpen={isLoginOpen} 
        onClose={() => setIsLoginOpen(false)} 
      />

      {/* Renderizamos el ChangePasswordDialog conectado a su estado */}
      <ChangePasswordDialog 
        isOpen={isChangePasswordOpen} 
        onClose={() => setIsChangePasswordOpen(false)} 
      />
    </div>
  );
}