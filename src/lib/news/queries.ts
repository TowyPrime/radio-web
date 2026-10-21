import { cache } from "react";
import type { NewsCategory } from "./constants";
import { NewsRecord, NewsSummary } from "./types";
import { createClient } from "@/utils/supabase/server";



export async function getNews(): Promise<NewsRecord[]> {

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('news')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener news:', error.message);
    throw new Error(error.message);
  }

  return data || [];
}



// Si se indica `category`, solo devuelve las noticias de esa categoría
export async function getNewsSummaries(
  category?: NewsCategory,
): Promise<NewsSummary[]> {
  const supabase = await createClient();

  let query = supabase
    .from('news')
    .select('id, title, summary, category, cover_url, author_name, created_at')
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  const { data: newsData, error: newsError } = await query;

  if (newsError || !newsData) {
    console.error("Error al obtener news:", newsError);
    throw new Error(newsError?.message || "Error al obtener los resúmenes de noticias");
  }

  return newsData;
}

// `cache` hace que, dentro de una misma petición, la página y `generateMetadata`
// compartan el resultado en lugar de consultar la noticia dos veces.
export const getNewsById = cache(
  async (id: string): Promise<NewsRecord | null> => {
    const supabase = await createClient();

    const { data: news, error } = await supabase
      .from("news")
      .select()
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Error al obtener news", error);
      throw new Error(
        error?.message || "Error al obtener la noticia especificada",
      );
    }

    return news;
  },
);

