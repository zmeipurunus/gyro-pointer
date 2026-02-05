import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Configuration
const PORT = process.env.PORT || 3000;
const SCREEN_WIDTH = 3840;
const SCREEN_HEIGHT = 2400;
const EMIT_INTERVAL = 200; // milliseconds between each coordinate emit (simulate mouse delay)

// Store the latest cursor coordinates (normalized 0-1)
let cursorCoords = { x: 0.5, y: 0.5 };

// Generate random coordinates
function getRandomCoordinates() {
  const x = Math.floor(Math.random() * SCREEN_WIDTH);
  const y = Math.floor(Math.random() * SCREEN_HEIGHT);
  return { x, y };
}

// Handle client connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Listen for cursor updates from the phone client
  socket.on('cursor-update', (data) => {
    cursorCoords = data;
    console.log('Cursor updated from phone:', cursorCoords);
  });
  
  // Start sending coordinates to this client
  const intervalId = setInterval(() => {
    // Map normalized coordinates to screen size
    const coords = {
      x: Math.round(cursorCoords.x * SCREEN_WIDTH),
      y: Math.round(cursorCoords.y * SCREEN_HEIGHT)
    };
    socket.emit('cursor-move', coords);
    // Uncomment for debugging:
    // console.log(`Sent to ${socket.id}:`, coords);
  }, EMIT_INTERVAL);
  
  // Clean up on disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    clearInterval(intervalId);
  });
});

// Health check endpoint for Render
app.get('/', (req, res) => {
  res.send('Gyro Pointer Server Running');
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Screen dimensions: ${SCREEN_WIDTH}x${SCREEN_HEIGHT}`);
});