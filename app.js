import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Serve static files (for mobile client)
app.use(express.static('public'));

// Serve the mobile controller page
app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'));
});

// Track connected clients
let desktopClients = new Set();
let mobileClients = new Set();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Handle mobile client sending coordinates
  socket.on('mobile-move', (data) => {
    // Broadcast to all desktop clients
    desktopClients.forEach(desktopId => {
      io.to(desktopId).emit('cursor-move', data);
    });
  });
  
  // Register as desktop client
  socket.on('register-desktop', () => {
    desktopClients.add(socket.id);
    console.log('Desktop client registered:', socket.id);
    console.log('Total desktop clients:', desktopClients.size);
  });
  
  // Register as mobile client
  socket.on('register-mobile', () => {
    mobileClients.add(socket.id);
    console.log('Mobile client registered:', socket.id);
    console.log('Total mobile clients:', mobileClients.size);
  });
  
  // Clean up on disconnect
  socket.on('disconnect', () => {
    desktopClients.delete(socket.id);
    mobileClients.delete(socket.id);
    console.log('Client disconnected:', socket.id);
    console.log('Desktop clients:', desktopClients.size, '| Mobile clients:', mobileClients.size);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});