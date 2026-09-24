'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import type { User } from '@supabase/supabase-js';
import CreateStoryModal from './CreateStoryModal';

interface ClientHeaderProps {
  user: User | null;
}

export default function ClientHeader({ user }: ClientHeaderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="flex items-center justify-between mb-8">
      <h1 className="text-3xl font-bold text-white">Últimas Historias</h1>

      {/* Botón de publicar alineado a la derecha, visible solo si hay usuario */}
      {user && (
        <>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 px-5 py-2.5 rounded-full text-sm font-medium transition-all shadow-lg hover:border-slate-600 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Publicar</span>
          </button>

          <CreateStoryModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            userId={user.id}
            onStoryCreated={() => {
              router.refresh(); // Actualiza la página para mostrar la nueva historia al instante
            }}
          />
        </>
      )}
    </div>
  );
}