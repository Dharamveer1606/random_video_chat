import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

import { ChatMessage, PeerSignal, UserPresence } from '../../types';

// In-memory storage for active users and rooms
// In a production app, you would use Redis or a similar solution
const activeUsers: Map<string, UserPresence> = new Map();
const waitingUsers: Map<string, string> = new Map(); // userId -> preferences (serialized)
const activeRooms: Map<string, string[]> = new Map(); // roomId -> userIds

export const initializeSocketServer = (server: NetServer) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id}`);
    
    // User joins the platform
    socket.on('user:join', (userId: string) => {
      // Store user as active
      activeUsers.set(userId, {
        userId,
        status: 'online',
        lastActive: new Date()
      });
      
      // Broadcast to all clients that this user is online
      io.emit('user:status', {
        userId,
        status: 'online'
      });
    });

    // User requests to find a match
    socket.on('match:request', (data: { userId: string, preferences: string }) => {
      const { userId, preferences } = data;
      
      // Add user to waiting pool
      waitingUsers.set(userId, preferences);
      
      // Try to find a match
      findMatch(userId, socket, io);
    });

    // WebRTC signaling
    socket.on('signal', (data: PeerSignal) => {
      // Forward the signal to the intended recipient
      socket.to(data.userId).emit('signal', {
        userId: socket.id,
        signal: data.signal
      });
    });

    // User sends a chat message
    socket.on('message:send', (data: { roomId: string, message: ChatMessage }) => {
      const { roomId, message } = data;
      
      // Broadcast the message to everyone in the room
      io.to(roomId).emit('message:received', message);
    });

    // User stops searching for a match
    socket.on('match:cancel', (userId: string) => {
      waitingUsers.delete(userId);
    });

    // User disconnects from a chat
    socket.on('chat:leave', (data: { userId: string, roomId: string }) => {
      const { userId, roomId } = data;
      
      // Remove the room if it exists
      if (activeRooms.has(roomId)) {
        const participants = activeRooms.get(roomId) || [];
        activeRooms.set(roomId, participants.filter(id => id !== userId));
        
        // Notify remaining participants that someone left
        socket.to(roomId).emit('user:left', userId);
        
        // If no participants left, delete the room
        if (activeRooms.get(roomId)?.length === 0) {
          activeRooms.delete(roomId);
        }
      }
      
      // Leave the socket room
      socket.leave(roomId);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
      
      // Remove user from active users
      let disconnectedUserId = '';
      
      // Find the user by socket id
      for (const [userId, presence] of activeUsers.entries()) {
        if (presence.userId === socket.id) {
          disconnectedUserId = userId;
          break;
        }
      }
      
      if (disconnectedUserId) {
        activeUsers.delete(disconnectedUserId);
        waitingUsers.delete(disconnectedUserId);
        
        // Notify others this user is offline
        io.emit('user:status', {
          userId: disconnectedUserId,
          status: 'offline'
        });
        
        // Remove user from any active rooms
        for (const [roomId, participants] of activeRooms.entries()) {
          if (participants.includes(disconnectedUserId)) {
            activeRooms.set(roomId, participants.filter(id => id !== disconnectedUserId));
            
            // Notify room participants
            socket.to(roomId).emit('user:left', disconnectedUserId);
            
            // Clean up empty rooms
            if (activeRooms.get(roomId)?.length === 0) {
              activeRooms.delete(roomId);
            }
          }
        }
      }
    });
  });

  return io;
};

// Function to find a match for a user
const findMatch = (userId: string, socket: any, io: SocketIOServer) => {
  // Simple random matching for now
  // In a real app, you would use preferences to find a better match
  const waitingUserIds = Array.from(waitingUsers.keys()).filter(id => id !== userId);
  
  if (waitingUserIds.length === 0) {
    // No matches available
    socket.emit('match:waiting');
    return;
  }
  
  // For simplicity, just pick the first waiting user
  const matchedUserId = waitingUserIds[0];
  
  // Create a new room
  const roomId = uuidv4();
  activeRooms.set(roomId, [userId, matchedUserId]);
  
  // Remove both users from waiting pool
  waitingUsers.delete(userId);
  waitingUsers.delete(matchedUserId);
  
  // Add both users to the room
  socket.join(roomId);
  io.sockets.sockets.get(matchedUserId)?.join(roomId);
  
  // Notify both users of the match
  io.to(roomId).emit('match:success', {
    roomId,
    participants: [userId, matchedUserId]
  });
}; 