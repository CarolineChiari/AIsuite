export interface Conversation {
  id: string;
  user?: string;
  title?: string;
  messages: Message[];
  date?: Date;
}

export interface Message {
  role: string;
  content: string;
}

export interface ChatError {
  error: string;
  status: number;
}
