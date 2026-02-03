// Import Libraries and Setup

import express from "express";
import http from "http";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);//socket.io needs an http server
const io = new Server(server);
const port = process.env.PORT || 4444;

//Tell our Node.js Server to host our P5.JS sketch from the public folder
app.use(express.static("public"));

// Setup Our Node.js server to listen to connections
server.listen(port, () => {
  console.log("listening on: "+port);
});


// EXPERIENCE STATE server is the authority
let experienceState = {
  users: {}            // socket.id -> movement data
};


// Callback function for when our P5.JS sketch connects 
io.on("connection", (socket) => {
  console.log("a user connected: ", socket.id);

  // Create user + data structure
  experienceState.users[socket.id] = {
    screenPosition: { 
      x: 0,
      y: 0
    },
    acceleration: {
      x: 0,
      y: 0,
      z: 0,
    },
    rotationRate: {
      alpha: 0,
      beta: 0,
      gamma: 0,
    },
    orientation: {
      alpha: 0,
      beta: 0,
      gamma: 0,
    }
  };

  // Send FULL state once (on join only)
  socket.emit("init", {
    id: socket.id,
    state: experienceState
  });

  // Tell others a new user joined
  socket.broadcast.emit("userJoined", {
    id: socket.id,
    user: experienceState.users[socket.id]
  });

  // Code to run every time we get a message from front-end P5.JS
  socket.on("motionData", (data) => {
    console.log(data);// print to console
    const user = experienceState.users[socket.id];
    if (!user) return;

    user.screenPosition = data.screenPosition;
    user.acceleration = data.acceleration;
    user.rotationRate = data.rotationRate;
    user.orientation = data.orientation;

    //broadcast.emit means send to everyone but the sender
    socket.broadcast.emit("userMoved", {
      id: socket.id,
      motion: data
    });

  });

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
    
    delete experienceState.users[socket.id];

    io.emit("userLeft", socket.id);
  });

});

