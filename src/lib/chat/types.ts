export interface ChatMessage {
  id: string;
  author: string;
  text: string;
  time: string;
  role?: 'locutor' | 'admin';
  mine?: boolean;
}

