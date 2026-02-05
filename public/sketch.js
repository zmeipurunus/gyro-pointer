const socket = io();

var x, y;
var forceX = 0;
var forceY = 0;
var vitx, vity, diam;
var connected = false;

function setup() {
  createCanvas(windowWidth, windowHeight);
  x = width / 2;
  y = height / 2;
  vitx = 2;
  vity = 2;
  diam = 40;
  
  // Start tracking gyroscope
  gyro.frequency = 10;
  gyro.startTracking(function(o) {
    forceX = o.gamma / 50;
    forceY = o.beta / 50;
  });
  
  // Socket connection events
  socket.on('connect', () => {
    connected = true;
    console.log('Connected to server:', socket.id);
  });
  
  socket.on('disconnect', () => {
    connected = false;
    console.log('Disconnected from server');
  });
}

function draw() {
  background('#FFFFFF');
  
  // Display connection status
  fill(connected ? '#00FF00' : '#FF0000');
  noStroke();
  ellipse(20, 20, 15, 15);
  
  // Display gyro data
  fill(0);
  textSize(16);
  text("forceX: " + forceX.toFixed(2), 40, 25);
  text("forceY: " + forceY.toFixed(2), 40, 45);
  text("x: " + Math.round(x), 40, 65);
  text("y: " + Math.round(y), 40, 85);
  
  // Update ball position
  x += vitx * forceX;
  y += vity * forceY;
  
  // Keep ball within canvas
  x = constrain(x, diam / 2, width - diam / 2);
  y = constrain(y, diam / 2, height - diam / 2);
  
  // Draw ball
  fill('#4A90E2');
  stroke('#2E5C8A');
  strokeWeight(2);
  ellipse(x, y, diam, diam);
  
  // Send coordinates to server
  if (connected) {
    socket.emit('mobile-move', { x: Math.round(x), y: Math.round(y) });
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}