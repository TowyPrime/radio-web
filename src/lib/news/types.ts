export interface NewsRecord {
  id: string;
  title: string;
  summary: string;
  category: string;
  body: string;
  cover_path: string | null;
  cover_url: string | null;
  author_name: string;
  created_at: string;
  updated_at: string | null;
}

export type newsSummary = Pick<
  NewsRecord,
  | "id"
  | "title"
  | "summary"
  | "category"
  | "cover_url"
  | "author_name"
  | "created_at"
>;
