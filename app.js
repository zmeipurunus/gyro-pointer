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

app.use(express.static("public"));

// Handle client connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Listen for mobile gyroscope data
  socket.on('mobile-move', (coords) => {
    // Forward coordinates to all desktop clients
    desktopClients.forEach(clientId => {
      io.to(clientId).emit('cursor-move', coords);
    });
  });
  
  // Allow clients to register as desktop or mobile
  socket.on('register-desktop', () => {
    desktopClients.push(socket.id);
    console.log('Desktop client registered:', socket.id);
  });
  
  socket.on('register-mobile', () => {
    mobileClients.push(socket.id);
    console.log('Mobile client registered:', socket.id);
  });
  
  // Clean up on disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    desktopClients = desktopClients.filter(id => id !== socket.id);
    mobileClients = mobileClients.filter(id => id !== socket.id);
  });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  console.log(`Screen dimensions: ${SCREEN_WIDTH}x${SCREEN_HEIGHT}`);
});