//global variables
let askButton;

// device motion
let accX = 0;
let accY = 0; 
let accZ = 0;
let rrateX = 0;
let rrateY = 0; 
let rrateZ = 0;

let x;
let y;

// device orientation
let rotateDegrees = 0;
let frontToBack = 0; 
let leftToRight = 0; 

// Socket.io connection
let socket;

function setup() {
  createCanvas(400, 400);
  rectMode(CENTER);
  angleMode(DEGREES);
  
  x = width/2;
  y = height/2;
  
  // Connect to the server
  socket = io();
  console.log('Connecting to server...');
  
  socket.on('connect', () => {
    console.log('Connected to server');
  });
  
  //----------
  //the bit between the two comment lines could be move to a three.js sketch except you'd need to create a button there
  if(typeof DeviceMotionEvent.requestPermission === 'function' && typeof DeviceOrientationEvent.requestPermission === 'function'){
    // iOS 13+
    askButton = createButton('Permission');//p5 create button
    askButton.mousePressed(handlePermissionButtonPressed);//p5 listen to mousePressed event
  }else{
    //if there is a device that doesn't require permission
    window.addEventListener('devicemotion', deviceMotionHandler, true);
    window.addEventListener('deviceorientation', deviceTurnedHandler, true);
  }
  
  //----------
  
}

//we are using p5.js to visualise this movement data
function draw() {
  
  let totalMovement = Math.abs(accX)+Math.abs(accY)+Math.abs(accZ);//movement in any direction
  //set your own threshold for how sensitive you want this to be
  if(totalMovement > 2){
     background(0,255,0);
  }else{
     background(255);
  }
  
  fill(0); 
  noStroke();
  circle(x, y, 10);
  
  if (leftToRight > 10) { 
    x += 2; // Right
  } 
  if (leftToRight < -10) { 
    x -= 2; // Left
  }
  if (frontToBack > 10) { 
    y += 2; // Down
  } 
  if (frontToBack < -10) { 
    y -= 2; // Top 
  }
  
  // Keep circle within canvas bounds
  x = constrain(x, 0, width);
  y = constrain(y, 0, height);
  
  // Send position to server
  socket.emit('mobile-move', { x: x, y: y });
  
  //Creating a tilt sensor mechanic that has a sort of boolean logic (on or off)
  //if the phone is rotated front/back/left/right we will get an arrow point in that direction 
  push();
  translate(width/2, height/2);
 
  if(frontToBack > 40){ //down, red
    push();
    fill(255,0,0);
    rotate(-180);
    triangle(-30,-40,0,-100,30,-40);
    pop();
    
    // subtract from y
  }else if(frontToBack < 0){ //top, blue
    push();
    fill(0,0,255);
    triangle(-30,-40,0,-100,30,-40);
    pop();
  }
  
  if(leftToRight > 20){ //right, yellow
    push();
    fill(255,255,0);
    rotate(90);
    triangle(-30,-40,0,-100,30,-40);
    pop();
  }else if(leftToRight < -20){//left, pink
    push();
    fill(255,0,255);
    rotate(-90);
    triangle(-30,-40,0,-100,30,-40);
    pop();
  }
  pop();
  
  //Debug text
  fill(0);
  textSize(15);
  
  text("acceleration: ", 10, 10);
  text(accX.toFixed(2) + ", " + accY.toFixed(2) + ", " + accZ.toFixed(2), 10, 40);

  text("rotation rate: ", 10, 80);
  text(rrateX.toFixed(2) + ", " + rrateY.toFixed(2) + ", " + rrateZ.toFixed(2), 10, 110);
  
  text("device orientation: ", 10, 150);
  text(rotateDegrees.toFixed(2) + ", " + leftToRight.toFixed(2) + ", " + frontToBack.toFixed(2), 10, 180);  
  
}


//Everything below here you could move to a three.js or other javascript sketch

function handlePermissionButtonPressed(){

    DeviceMotionEvent.requestPermission()
    .then(response => {
      // alert(response);//quick way to debug response result on mobile, you get a mini pop-up
      if (response === 'granted') {
        window.addEventListener('devicemotion', deviceMotionHandler, true);
      }
    });

    DeviceOrientationEvent.requestPermission()
    .then(response => {
      if (response === 'granted') {
        // alert(response);//quick way to debug response result on mobile, you get a mini pop-up
        window.addEventListener('deviceorientation', deviceTurnedHandler, true);
      }
    })
    .catch(console.error);  
}

//AVERAGE YOUR DATA!!!
//Microphone input from last term.... 

// https://developer.mozilla.org/en-US/docs/Web/API/Window/devicemotion_event
function deviceMotionHandler(event){
  
  accX = event.acceleration.x;
  accY = event.acceleration.y;
  accZ = event.acceleration.z;
  
  rrateZ = event.rotationRate.alpha;//alpha: rotation around z-axis
  rrateX = event.rotationRate.beta;//rotating about its X axis; that is, front to back
  rrateY = event.rotationRate.gamma;//rotating about its Y axis: left to right
  
}

//https://developer.mozilla.org/en-US/docs/Web/API/Window/deviceorientation_event
function deviceTurnedHandler(event){
  
  //degrees 0 - 365
  rotateDegrees = event.alpha; // alpha: rotation around z-axis
  frontToBack = event.beta; // beta: front back motion
  leftToRight = event.gamma; // gamma: left to right

}