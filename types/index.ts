export interface User {
  id: string;
  name?: string;
  email?: string;
  image?: string;
  interests?: string[];
  isOnline?: boolean;
  lastActive?: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
}

export interface ChatRoom {
  id: string;
  participants: string[];
  messages: ChatMessage[];
  createdAt: Date;
  isActive: boolean;
}

export interface MatchPreferences {
  interests?: string[];
  language?: string;
  gender?: string;
}

export interface UserPresence {
  userId: string;
  roomId?: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  lastActive: Date;
}

export interface PeerSignal {
  userId: string;
  signal: any;
}

export interface MediaStatus {
  video: boolean;
  audio: boolean;
} 