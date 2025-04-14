import { createServer } from 'http';
import { NextRequest } from 'next/server';
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
export async function GET(request: NextRequest) {
  return new Response(JSON.stringify({ 
    status: 'Socket.io server running', 
    port 
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

export const dynamic = 'force-dynamic'; 