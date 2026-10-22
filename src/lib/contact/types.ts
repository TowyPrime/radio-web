export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
  /** null = sin leer */
  read_at: string | null;
}
