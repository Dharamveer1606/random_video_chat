'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import TextChat from '../../../components/TextChat';
import VideoChat from '../../../components/VideoChat';
import { useSocket } from '../../../lib/hooks/useSocket';

interface ChatPageProps {
  params: {
    roomId: string;
  };
}

interface SessionUser {
  id?: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export default function ChatPage({ params }: ChatPageProps) {
  const { roomId } = params;
  const router = useRouter();
  const { data: session } = useSession();
  const [remoteUserId, setRemoteUserId] = useState<string | undefined>();
  const [showTextChat, setShowTextChat] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  // Get userId from session or localStorage for guest users
  const [userId, setUserId] = useState<string>('');
  
  useEffect(() => {
    // Try to get user ID from session (if available)
    const sessionUserId = (session?.user as SessionUser)?.id;
    
    if (sessionUserId) {
      setUserId(sessionUserId);
      return;
    }
    
    // Otherwise, try to get from localStorage or generate a new one
    if (typeof window !== 'undefined') {
      const storedGuestId = localStorage.getItem('guestId');
      if (storedGuestId) {
        setUserId(storedGuestId);
      } else {
        const newGuestId = uuidv4();
        localStorage.setItem('guestId', newGuestId);
        setUserId(newGuestId);
      }
    }
  }, [session]);
  
  const { socket, leaveChat } = useSocket(userId);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get participants in the room
  useEffect(() => {
    if (!socket || !userId) return;

    const handleParticipants = (data: { participants: string[] }) => {
      // Find the other participant (not the current user)
      const otherParticipant = data.participants.find(id => id !== userId);
      setRemoteUserId(otherParticipant);
    };

    const handleUserLeft = (leftUserId: string) => {
      if (leftUserId === remoteUserId) {
        // The other user left, show notification and reset
        setRemoteUserId(undefined);
        // Optionally redirect back to home after a delay
        setTimeout(() => {
          router.push('/');
        }, 5000);
      }
    };

    socket.on('room:participants', handleParticipants);
    socket.on('user:left', handleUserLeft);

    // Request current participants when joining
    socket.emit('room:participants', { roomId });

    return () => {
      socket.off('room:participants', handleParticipants);
      socket.off('user:left', handleUserLeft);
    };
  }, [socket, userId, roomId, router, remoteUserId]);

  // Handle end call and navigation back to home
  const handleEndChat = () => {
    leaveChat(roomId);
    router.push('/');
  };

  // Toggle between text and video chat on mobile
  const toggleChatMode = () => {
    setShowTextChat(!showTextChat);
  };

  // If no userId, show loading
  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header with controls */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold text-white">Random Chat</h1>
          <div className="flex items-center gap-4">
            {/* Mobile toggle between video and text */}
            {windowSize.width < 768 && (
              <button
                onClick={toggleChatMode}
                className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600"
              >
                {showTextChat ? 'Show Video' : 'Show Text Chat'}
              </button>
            )}
            <button
              onClick={handleEndChat}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
            >
              End Chat
            </button>
          </div>
        </div>
      </header>

      {/* Chat container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Video chat */}
        {(windowSize.width >= 768 || !showTextChat) && (
          <div className={`${windowSize.width >= 768 ? 'flex-1' : 'h-full'}`}>
            <VideoChat
              userId={userId}
              roomId={roomId}
              remoteUserId={remoteUserId}
              onCallEnd={handleEndChat}
            />
          </div>
        )}

        {/* Text chat (side panel on desktop, toggle on mobile) */}
        {(windowSize.width >= 768 || showTextChat) && (
          <div className={`${windowSize.width >= 768 ? 'w-96 border-l border-gray-700' : 'h-full'}`}>
            <TextChat
              userId={userId}
              roomId={roomId}
              userName={(session?.user as SessionUser)?.name || undefined}
            />
          </div>
        )}
      </div>
    </main>
  );
}