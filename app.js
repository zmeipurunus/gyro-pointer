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

// Generate random coordinates
function getRandomCoordinates() {
  const x = Math.floor(Math.random() * SCREEN_WIDTH);
  const y = Math.floor(Math.random() * SCREEN_HEIGHT);
  return { x, y };
}

// Handle client connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Start sending random coordinates to this client
  const intervalId = setInterval(() => {
    const coords = getRandomCoordinates();
    socket.emit('cursor-move', coords);
    console.log(`Sent to ${socket.id}:`, coords);
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