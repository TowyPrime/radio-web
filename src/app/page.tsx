import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import StoryCard from '@/components/StoryCard';
import ClientHeader from '@/components/ClientHeader';
import { getCurrentVisitor, createServiceRoleClient } from '@/utils/supabase/service';

export default async function Home() {
  const supabase = await createClient();
  const supabaseService = createServiceRoleClient();

  let user = null;

  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (!authError && authUser) {
      user = authUser;
    }
  } catch (error) {
    console.error('Error al obtener la sesión:', error);
  }

  let visitor = null;
  try {
    visitor = await getCurrentVisitor();
  } catch (err) {
    console.error('Error al obtener visitante actual', err);
  }

  const visitoruid = visitor?.visitorUid ?? null;

  const { data: stories, error } = await supabase
    .from('stories')
    .select('id, title, content, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al cargar historias:', error);
  }

  const allStories = stories ?? [];

  // ids de las historias
  const storyIds = allStories.map((s) => s.id);

  // Consulta a `likes`, solo si hay historias que mostrar
  let likesData: { visitor_uid: string; story_id: string }[] = [];
  if (storyIds.length > 0) {
    const { data: likesRows, error: likesError } = await supabaseService
      .from('likes')
      .select('visitor_uid, story_id')
      .in('story_id', storyIds);

    if (likesError) {
      console.error('Error al cargar los likes:', likesError);
    } else {
      likesData = likesRows ?? [];
    }
  }

  // Conteo de likes por historia y cuáles marcó el visitante actual
  const likeCounts: Record<string, number> = {};
  const likedByMe = new Set<string>();

  for (const row of likesData) {
    const storyId = String(row.story_id);
    likeCounts[storyId] = (likeCounts[storyId] ?? 0) + 1;

    if (visitoruid && row.visitor_uid === visitoruid) {
      likedByMe.add(storyId);
    }
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-950 text-slate-100 w-full pb-16">

      {/* Contenedor Principal de Historias */}
      <main className="w-full px-4 md:px-8 py-8 max-w-4xl mx-auto">

        {/* Encabezado con el Título a la izquierda y el Botón Publicar a la derecha */}
        <ClientHeader user={user} />

        <div className="space-y-6">
          {error && (
            <p className="text-center text-red-400 py-12">
              No se pudieron cargar las historias. Intenta de nuevo más tarde.
            </p>
          )}

          {!error && allStories.length === 0 && (
            <p className="text-center text-slate-400 py-12">
              Todavía no hay historias publicadas.
            </p>
          )}

          {allStories.map((story) => (
            <StoryCard
            storyId={story.id}
              key={story.id}
              title={story.title}
              content={story.content}
              fechaCreacion={new Date(story.created_at).toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              categoria="CRÓNICA"
              authorName="Con el pie derecho radio"
              authorRole="Admin"
              likesCount={likeCounts[String(story.id)] ?? 0}
              initialLiked={likedByMe.has(String(story.id))}
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
