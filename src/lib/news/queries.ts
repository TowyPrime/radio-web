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



export async function getNewsSummaries(): Promise<NewsSummary[]> {
const supabase = await createClient();

  const { data: newsData, error: newsError } = await supabase
    .from('news')
    .select('id, title, summary, category, cover_url, author_name, created_at')
    .order('created_at', { ascending: false });

  if (newsError || !newsData) {
    console.error("Error al obtener news:", newsError);
    throw new Error(newsError?.message || "Error al obtener los resúmenes de noticias");
  }

  return newsData;
}

export async function getNewsById(id: string): Promise<NewsRecord | null>  {
  const supabase = await createClient();

  const {data: news, error} = await supabase.from('news')
  .select()
  .eq('id', id)
  .maybeSingle();

  if(error ){
    console.error("Error al obtener news", error);
    throw new Error(error?.message || "Error al obtener la noticia especificada");
  }

  return news;
}

