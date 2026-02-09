const robot = require("@hurdlegroup/robotjs");
const io = require("socket.io-client");

// Configuration
const SERVER_URL = "https://gyro-pointer.onrender.com/";
const MOUSE_DELAY = 2; // Milliseconds between mouse movements

// Connect to the server
console.log(`Connecting to ${SERVER_URL}...`);
const socket = io(SERVER_URL, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: Infinity
});

// Speed up the mouse
robot.setMouseDelay(MOUSE_DELAY);

// Get screen dimensions for boundary checking
const screenSize = robot.getScreenSize();
console.log(`Screen size: ${screenSize.width}x${screenSize.height}`);

// Connection events
socket.on("connect", () => {
  console.log("✓ Connected to server");
  console.log("Socket ID:", socket.id);
  
  // Identify this client as desktop to the server
  socket.emit('identify', 'desktop');
});

socket.on("disconnect", (reason) => {
  console.log("✗ Disconnected from server:", reason);
});

// Handle rejection if another desktop client is already connected
socket.on("rejected", (message) => {
  console.error("Connection rejected:", message);
  process.exit(1);
});

// Listen for normalized cursor coordinates from the server
socket.on("cursor-move", (data) => {
  try {
    let { x, y } = data;
    
    // Validate coordinates are in 0-1 range
    if (typeof x !== "number" || typeof y !== "number") {
      console.warn("Invalid coordinates received:", data);
      return;
    }
    
    // Map normalized coordinates (0-1) to screen dimensions
    let screenX = Math.round(x * screenSize.width);
    let screenY = Math.round(y * screenSize.height);
    
    // Clamp coordinates to screen boundaries
    screenX = Math.max(0, Math.min(screenX, screenSize.width - 1));
    screenY = Math.max(0, Math.min(screenY, screenSize.height - 1));
    
    // Move the mouse
    robot.moveMouse(screenX, screenY);
    
    // Optional: Log movements (comment out for production)
    // console.log(`Moved cursor to (${screenX}, ${screenY})`);
  } catch (error) {
    console.error("Error moving mouse:", error.message);
  }
});

// Handle other potential events from server
// socket.on("cursor-click", (data) => {
//   try {
//     const button = data?.button || "left";
//     robot.mouseClick(button);
//     console.log(`Clicked ${button} mouse button`);
//   } catch (error) {
//     console.error("Error clicking mouse:", error.message);
//   }
// });

// Handle mouse down / up events from server
socket.on("cursor-down", () => {
  try {
    robot.mouseToggle("down", "left");
    console.log(`✓ Mouse down (left)`);
  } catch (error) {
    console.error("Error mouse down:", error.message);
  }
});

socket.on("cursor-up", () => {
  try {
    robot.mouseToggle("up", "left");
    console.log(`✓ Mouse up (left)`);
  } catch (error) {
    console.error("Error mouse up:", error.message);
  }
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down...");
  socket.disconnect();
  process.exit(0);
});

console.log("Gun-mouse client is running. Press Ctrl+C to exit.");