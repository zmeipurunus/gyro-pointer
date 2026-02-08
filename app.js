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

// Serve static files from the public folder
app.use(express.static('public'));

// Configuration
const PORT = process.env.PORT || 3000;
const EMIT_INTERVAL = 50; // milliseconds between each coordinate emit

// Store the latest cursor coordinates (normalized 0-1 range)
let cursorCoords = { x: 0.5, y: 0.5 };

// Handle client connections
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  // Listen for cursor updates from the phone client
  socket.on('cursor-update', (data) => {
    cursorCoords = data;
    console.log('Cursor updated from phone:', cursorCoords);
  });
  
  // // Listen for click events from the phone client
  // socket.on('cursor-click', (data) => {
  //   console.log('Click received from phone');
  //   // Broadcast click to all connected desktop clients
  //   io.emit('cursor-click', data);
  // });

  // Listen for mouse down / up events from the phone client and forward them
  socket.on('cursor-down', (data) => {
    console.log('Cursor down received from phone');
    io.emit('cursor-down', data);
  });

  socket.on('cursor-up', (data) => {
    console.log('Cursor up received from phone');
    io.emit('cursor-up', data);
  });
  
  // Start sending normalized coordinates to this client
  const intervalId = setInterval(() => {
    // Emit normalized coordinates (0-1 range) to desktop client
    socket.emit('cursor-move', cursorCoords);
    // Uncomment for debugging:
    // console.log(`Sent to ${socket.id}:`, cursorCoords);
  }, EMIT_INTERVAL);
  
  // Clean up on disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    clearInterval(intervalId);
  });
});

// Health check endpoint for Render
app.get('/', (req, res) => {
  res.sendFile('public/index.html', { root: '.' });
});

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});