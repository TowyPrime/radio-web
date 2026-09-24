import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import StoryCard from '@/components/StoryCard';
import ClientHeader from '@/components/ClientHeader';
import { demoStories, type DemoStory } from '@/data/demo';

export default async function Home() {
  const supabase = await createClient();

  let user = null;

  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (!authError && authUser) {
      user = authUser;
    }
  } catch (error) {
    console.error('Error al obtener la sesión:', error);
  }

  const { data: stories, error } = await supabase
    .from('stories')
    .select('id, title, content, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al cargar historias:', error);
  }

  // Muestra: historias reales de la base de datos + historias de ejemplo
  // (con likes y comentarios de muestra mientras esas tablas no estén conectadas).
  const realStories: DemoStory[] = (stories ?? []).map((s, i) => ({
    id: String(s.id),
    title: s.title,
    content: s.content,
    created_at: s.created_at,
    categoria: 'CRÓNICA',
    likes: demoStories[i % demoStories.length].likes,
    comments: demoStories[i % demoStories.length].comments,
  }));
  const realTitles = new Set(realStories.map((s) => s.title));
  const allStories = [
    ...realStories,
    ...demoStories.filter((s) => !realTitles.has(s.title)),
  ];

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-950 text-slate-100 w-full pb-16">
      
      {/* Contenedor Principal de Historias */}
      <main className="w-full px-4 md:px-8 py-8 max-w-4xl mx-auto">
        
        {/* Encabezado con el Título a la izquierda y el Botón Publicar a la derecha */}
        <ClientHeader user={user} />
        
        <div className="space-y-6">
          {allStories.map((story) => (
            <StoryCard
              key={story.id}
              title={story.title}
              content={story.content}
              fechaCreacion={new Date(story.created_at).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              categoria={story.categoria}
              authorName="Con el pie derecho radio"
              authorRole="Admin"
              likesCount={story.likes}
              initialComments={story.comments}
            />
          ))}
        </div>
      </main>

      {/* Botón flotante del chat */}
      <Link
          href="/chat"
          className="fixed bottom-8 right-8 z-50 bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-400/50"
          aria-label="Abrir chat"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
      </Link>
    </div>
  );
}