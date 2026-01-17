
export type Role = 'user' | 'assistant' | 'system';

export interface User {
  id: string;
  email: string;
  isOwner?: boolean;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
  image?: string;
  sources?: { title: string; uri: string }[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}
