const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

// Create an HTTP server
const server = http.createServer((req, res) => {
  // Add a basic health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
    return;
  }
  
  // Simple CORS headers for all requests
  res.writeHead(200, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, GET, POST',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end('Socket.io server running');
});

// In-memory storage for active users and rooms
const activeUsers = new Map();
const waitingUsers = new Map(); // userId -> preferences (serialized)
const activeRooms = new Map(); // roomId -> userIds

// Create Socket.io server with more permissive settings
const io = new Server(server, {
  cors: {
    origin: '*', // In production, restrict this to your domain
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 30000,
  pingInterval: 10000,
  connectTimeout: 30000,
  allowEIO3: true,
  transports: ['websocket', 'polling']
});

// Set up connection monitoring
setInterval(() => {
  const connectedSockets = Array.from(io.sockets.sockets.keys()).length;
  console.log(`[Health] ${new Date().toISOString()} - Connected clients: ${connectedSockets}`);
  console.log(`[Health] Active users: ${activeUsers.size}, Waiting users: ${waitingUsers.size}, Active rooms: ${activeRooms.size}`);
}, 30000);

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);
  
  // Send initial confirmation to client
  socket.emit('connection:established', { socketId: socket.id });
  
  // User joins the platform
  socket.on('user:join', (userId) => {
    if (!userId) {
      console.error('Received user:join event without userId');
      return;
    }
    
    console.log(`User joined: ${userId}`);
    // Store user as active
    activeUsers.set(userId, {
      userId,
      socketId: socket.id,
      status: 'online',
      lastActive: new Date()
    });
    
    // Broadcast to all clients that this user is online
    io.emit('user:status', {
      userId,
      status: 'online'
    });
    
    // Acknowledge successful join
    socket.emit('user:join:success', { userId });
  });

  // User requests to find a match
  socket.on('match:request', (data) => {
    if (!data || !data.userId) {
      console.error('Received match:request event without proper data', data);
      socket.emit('error', { message: 'Invalid match request data' });
      return;
    }
    
    console.log(`Match requested by user: ${data.userId}`);
    const { userId, preferences } = data;
    
    // Add user to waiting pool
    waitingUsers.set(userId, preferences);
    
    // Try to find a match
    findMatch(userId, socket);
  });

  // Get room participants
  socket.on('room:participants', ({ roomId }) => {
    if (!roomId) {
      console.error('Received room:participants event without roomId');
      return;
    }
    
    console.log(`Room participants requested for room: ${roomId}`);
    const participants = activeRooms.get(roomId) || [];
    socket.emit('room:participants', { participants });
  });

  // WebRTC signaling
  socket.on('signal', (data) => {
    if (!data || !data.userId) {
      console.error('Received signal event without proper data');
      return;
    }
    
    console.log(`Signal from ${socket.id} to ${data.userId}`);
    // Forward the signal to the intended recipient
    const targetUser = Array.from(activeUsers.values()).find(user => 
      user.userId === data.userId
    );
    
    if (targetUser) {
      io.to(targetUser.socketId).emit('signal', {
        userId: socket.id,
        signal: data.signal
      });
    } else {
      console.error(`Could not find target user ${data.userId} for signaling`);
      socket.emit('error', { message: 'Target user not found' });
    }
  });

  // User sends a chat message
  socket.on('message:send', (data) => {
    if (!data || !data.roomId || !data.message) {
      console.error('Received message:send event without proper data');
      return;
    }
    
    console.log(`Message sent in room: ${data.roomId}`);
    const { roomId, message } = data;
    
    // Broadcast the message to everyone in the room
    io.to(roomId).emit('message:received', message);
  });

  // User stops searching for a match
  socket.on('match:cancel', (userId) => {
    if (!userId) {
      console.error('Received match:cancel event without userId');
      return;
    }
    
    console.log(`Match cancelled by user: ${userId}`);
    waitingUsers.delete(userId);
    socket.emit('match:cancelled', { success: true });
  });

  // User disconnects from a chat
  socket.on('chat:leave', (data) => {
    if (!data || !data.userId || !data.roomId) {
      console.error('Received chat:leave event without proper data');
      return;
    }
    
    console.log(`User left chat: ${data.userId} from room ${data.roomId}`);
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
    socket.emit('chat:left', { success: true });
  });

  // Handle ping to keep connection alive
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: Date.now() });
  });

  // Handle error
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    
    // Find the user by socket id
    let disconnectedUserId = null;
    for (const [userId, user] of activeUsers.entries()) {
      if (user.socketId === socket.id) {
        disconnectedUserId = userId;
        break;
      }
    }
    
    if (disconnectedUserId) {
      console.log(`User disconnected: ${disconnectedUserId}`);
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
          io.to(roomId).emit('user:left', disconnectedUserId);
          
          // Clean up empty rooms
          if (activeRooms.get(roomId)?.length === 0) {
            activeRooms.delete(roomId);
          }
        }
      }
    }
  });
});

// Function to find a match for a user
function findMatch(userId, socket) {
  try {
    // Get all waiting users except the current one
    const waitingUserIds = Array.from(waitingUsers.keys()).filter(id => id !== userId);
    
    if (waitingUserIds.length === 0) {
      // No matches available
      socket.emit('match:waiting');
      console.log(`No matches available for user: ${userId}`);
      return;
    }
    
    // For simplicity, just pick the first waiting user
    const matchedUserId = waitingUserIds[0];
    console.log(`Matched users: ${userId} and ${matchedUserId}`);
    
    // Create a new room
    const roomId = uuidv4();
    activeRooms.set(roomId, [userId, matchedUserId]);
    
    // Remove both users from waiting pool
    waitingUsers.delete(userId);
    waitingUsers.delete(matchedUserId);
    
    // Get sockets for both users
    const user1 = activeUsers.get(userId);
    const user2 = activeUsers.get(matchedUserId);
    
    if (user1 && user2) {
      // Add both users to the room
      const socket1 = io.sockets.sockets.get(user1.socketId);
      const socket2 = io.sockets.sockets.get(user2.socketId);
      
      if (socket1) socket1.join(roomId);
      if (socket2) socket2.join(roomId);
      
      // Notify both users of the match
      io.to(roomId).emit('match:success', {
        roomId,
        participants: [userId, matchedUserId]
      });
      
      console.log(`Match created in room: ${roomId}`);
    } else {
      console.log('Could not find sockets for matched users');
      // Put users back in waiting pool
      if (userId && !activeUsers.has(userId)) waitingUsers.set(userId, '{}');
      if (matchedUserId && !activeUsers.has(matchedUserId)) waitingUsers.set(matchedUserId, '{}');
    }
  } catch (error) {
    console.error('Error in findMatch function:', error);
    socket.emit('error', { message: 'Error finding match' });
  }
}

// Handle server errors
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Handle uncaught exceptions to prevent server crash
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});

// Start the server
const PORT = process.env.SOCKET_PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
  console.log(`Health check endpoint: http://localhost:${PORT}/health`);
}); 