import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Socket instance
let socket: Socket | null = null;

// Socket server URL from environment variables or default
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

interface MatchPreferences {
  [key: string]: string | number | boolean;
}

interface MessageData {
  roomId: string;
  content: string;
  senderId: string;
  timestamp: string;
}

interface SignalData {
  userId: string;
  signal: RTCSessionDescriptionInit | RTCIceCandidate;
}

export const useSocket = (userId?: string) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const router = useRouter();
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Always create a new socket connection to ensure we're connected
    if (!socket) {
      console.log('Creating new socket connection to:', SOCKET_SERVER_URL);
      socket = io(SOCKET_SERVER_URL, {
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000, // Increase timeout to 20 seconds
        autoConnect: true,
        forceNew: false,
        transports: ['websocket', 'polling'] // Try WebSocket first, then fall back to polling
      });
    }

    // Set up event listeners
    const onConnect = () => {
      setIsConnected(true);
      console.log('Socket connected successfully');
      
      // Join as a user if we have a userId
      if (userId) {
        console.log('Joining as user:', userId);
        socket?.emit('user:join', userId);
      }
      
      // Set up heartbeat to keep connection alive
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      
      heartbeatInterval.current = setInterval(() => {
        if (socket?.connected) {
          socket.emit('ping');
        }
      }, 15000); // Send ping every 15 seconds
    };

    const onConnectError = (error: Error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    };

    const onError = (error: Error) => {
      console.error('Socket error:', error);
      setIsConnected(false);
    };

    const onDisconnect = (reason: string) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      
      // Clear heartbeat on disconnect
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = null;
      }
    };

    const onMatchSuccess = (data: { roomId: string }) => {
      console.log('Match found, roomId:', data.roomId);
      // Redirect to the chat room when a match is found
      router.push(`/chat/${data.roomId}`);
    };

    // Register event listeners
    socket.on('connect', onConnect);
    socket.on('connect_error', onConnectError);
    socket.on('error', onError);
    socket.on('disconnect', onDisconnect);
    socket.on('match:success', onMatchSuccess);
    socket.on('pong', () => console.log('Received pong from server'));
    socket.on('connection:established', (data) => {
      console.log('Connection established with server, socket ID:', data.socketId);
    });

    // Set a timeout to check connection status
    const connectionTimeout = setTimeout(() => {
      if (!socket?.connected) {
        console.log('Connection timeout - attempting fallback...');
        
        // Recreate the socket with only polling transport
        if (socket) {
          socket.close();
          const newSocket = io(SOCKET_SERVER_URL, {
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            timeout: 20000,
            autoConnect: true,
            forceNew: true,
            transports: ['polling'] // Force polling only
          });
          
          // Reattach listeners
          newSocket.on('connect', onConnect);
          newSocket.on('connect_error', onConnectError);
          newSocket.on('error', onError);
          newSocket.on('disconnect', onDisconnect);
          newSocket.on('match:success', onMatchSuccess);
          
          // Try to connect
          newSocket.connect();
          socket = newSocket;
        }
      }
    }, 5000);

    // Force connect
    if (!socket.connected) {
      console.log('Forcing socket connection...');
      socket.connect();
    } else {
      setIsConnected(true);
      console.log('Socket already connected');
      // Join as a user if we have a userId and already connected
      if (userId) {
        socket?.emit('user:join', userId);
      }
    }

    // Clean up on unmount
    return () => {
      clearTimeout(connectionTimeout);
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      socket?.off('connect', onConnect);
      socket?.off('connect_error', onConnectError);
      socket?.off('error', onError);
      socket?.off('disconnect', onDisconnect);
      socket?.off('match:success', onMatchSuccess);
    };
  }, [userId, router]);

  // Function to find a match
  const findMatch = (preferences: MatchPreferences = {}) => {
    if (!userId) {
      console.error('Cannot find match - no user ID provided');
      return;
    }
    
    if (!socket?.connected) {
      console.error('Socket not connected - trying to reconnect...');
      socket?.connect();
      setTimeout(() => {
        if (socket?.connected) {
          console.log('Reconnected, now sending match request');
          sendMatchRequest();
        } else {
          console.error('Failed to reconnect socket');
          // Try one more time with polling transport
          if (socket) {
            socket.close();
          }
          const newSocket = io(SOCKET_SERVER_URL, {
            transports: ['polling'],
            forceNew: true
          });
          newSocket.on('connect', () => {
            console.log('Connected via polling, sending match request');
            if (userId) newSocket.emit('user:join', userId);
            socket = newSocket;
            sendMatchRequest();
          });
          newSocket.connect();
        }
      }, 2000);
      return;
    }
    
    sendMatchRequest();
    
    function sendMatchRequest() {
      console.log('Sending match request for user:', userId);
      socket?.emit('match:request', {
        userId,
        preferences: JSON.stringify(preferences)
      });
    }
  };

  // Function to cancel matching
  const cancelMatch = () => {
    if (!userId || !socket?.connected) return;
    socket.emit('match:cancel', userId);
  };

  // Function to leave a chat
  const leaveChat = (roomId: string) => {
    if (!userId || !socket?.connected) return;
    socket.emit('chat:leave', { userId, roomId });
    router.push('/');
  };

  // Function to send a chat message
  const sendMessage = (roomId: string, message: MessageData) => {
    if (!socket?.connected) return;
    socket.emit('message:send', { roomId, message });
  };

  // Function to send WebRTC signaling data
  const sendSignal = (targetUserId: string, signal: RTCSessionDescriptionInit | RTCIceCandidate) => {
    if (!socket?.connected) return;
    socket.emit('signal', { userId: targetUserId, signal });
  };

  // Function to manually reconnect the socket
  const reconnect = () => {
    console.log('Manually attempting to reconnect socket...');
    if (socket) {
      socket.connect();
    } else {
      socket = io(SOCKET_SERVER_URL);
      socket.connect();
    }
  };

  return {
    socket,
    isConnected,
    findMatch,
    cancelMatch,
    leaveChat,
    sendMessage,
    sendSignal,
    reconnect
  };
}; 