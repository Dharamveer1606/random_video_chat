import { createServer } from 'http';
import { NextResponse } from 'next/server';
import { Server } from 'socket.io';
import { initializeSocketServer } from '../../../server/socket';

// Create an HTTP server
const httpServer = createServer();

// Initialize the Socket.io server
initializeSocketServer(httpServer);

// Start the server on a different port to avoid conflicts with Next.js
const port = parseInt(process.env.SOCKET_PORT || '3001', 10);
httpServer.listen(port, () => {
  console.log(`Socket.io server running on port ${port}`);
});

// This is a dummy API route handler - the actual WebSocket server runs separately
export async function GET() {
  const io = new Server({
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return NextResponse.json({ success: true });
}

export const dynamic = 'force-dynamic'; 