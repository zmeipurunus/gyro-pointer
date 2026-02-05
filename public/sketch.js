//global variables
let askButton;
const socket = io();

// device motion
let accX = 0;
let accY = 0; 
let accZ = 0;
let rrateX = 0;
let rrateY = 0; 
let rrateZ = 0;

let x
let y 
let followers = [];


// device orientation
let rotateDegrees = 0;
let frontToBack = 0; 
let leftToRight = 0; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  rectMode(CENTER);
  angleMode(DEGREES);
  
  x = width/2
  y = height/2
  
  for (let i = 0; i < 10; i++) {
    followers.push(new Vehicle(random(width), random(height)));
  }
  
  //----------
  //the bit between the two comment lines could be move to a three.js sketch except you'd need to create a button there
  if(typeof DeviceMotionEvent.requestPermission === 'function' && typeof DeviceOrientationEvent.requestPermission === 'function'){
    // iOS 13+
    askButton = createButton('Permission');//p5 create button
    askButton.mousePressed(handlePermissionButtonPressed);//p5 listen to mousePressed event
  }else{
    //if there is a device that doesn't require permission
    window.addEventListener('devicemotion', deviceMotionHandler, true);
    window.addEventListener('deviceorientation', deviceTurnedHandler, true)
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
  circle(x, y,10);
  
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
  
  let target = createVector(x, y);
  for (let f of followers) {
    f.arrive(target);
    f.update();
    f.display();
  }
  
  // Emit cursor position to server (throttled to every 5 frames)
  if (frameCount % 5 === 0) {
    socket.emit('cursor-update', {
      x: x / width,
      y: y / height
    });
  }

  
  //Creating a tilt sensor mechanic that has a sort of boolean logic (on or off)
  //if the phone is rotated front/back/left/right we will get an arrow point in that direction 
  push();
  translate(width/2,height/2);
 
  if(frontToBack > 1){ //down
    push();
    fill(100);
    rotate(-180);
    triangle(-15, -20, 0, -50, 15, -20);
    pop();
    
    
  }else if(frontToBack < -1){ //top
    push();
    fill(100);
    triangle(-15, -20, 0, -50, 15, -20);
    pop();
  }
  
  if(leftToRight > 1){ //right
    push();
    fill(100);
    rotate(90);
    triangle(-15, -20, 0, -50, 15, -20);
    pop();
  }else if(leftToRight < -1){//left
    push();
    fill(100);
    rotate(-90);
    triangle(-15, -20, 0, -50, 15, -20);
    pop();
  }
  pop();
  
  //Debug text
  fill(0);
  textSize(15);
  
  text("acceleration: ",10,10);
  text(accX.toFixed(2) +", "+accY.toFixed(2)+", "+accZ.toFixed(2),10,40);

  text("rotation rate: ",10,80);
  text(rrateX.toFixed(2) +", "+rrateY.toFixed(2)+", "+rrateZ.toFixed(2),10,110);
  
  
  text("device orientation: ",10,150);
  text(rotateDegrees.toFixed(2) +", "+leftToRight.toFixed(2) +", "+frontToBack.toFixed(2),10,180);  
  
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
        window.addEventListener('deviceorientation', deviceTurnedHandler, true)
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

class Vehicle {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.velocity = createVector(0, 0);
    this.acceleration = createVector(0, 0);
    this.maxspeed = random(2, 5); 
    this.maxforce = random(0.05, 0.2);
    this.color = color(random(255), random(255), random(255), 150);
    this.shapeType = floor(random(3)); // 0:圓, 1:方, 2:三角
    this.size = random(15, 30);
  }

  arrive(target) {
    let desired = p5.Vector.sub(target, this.position);
    let d = desired.mag();
    if (d < 100) {
      let m = map(d, 0, 100, 0, this.maxspeed);
      desired.setMag(m);
    } else {
      desired.setMag(this.maxspeed);
    }
    let steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxforce);
    this.acceleration.add(steer);
  }

  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxspeed);
    this.position.add(this.velocity);
    this.acceleration.mult(0);
  }

  display() {
    fill(this.color);
    noStroke();
    push();
    translate(this.position.x, this.position.y);
    if (this.shapeType === 0) {
      circle(0, 0, this.size);
    } else if (this.shapeType === 1) {
      rect(0, 0, this.size, this.size);
    } else {
      triangle(0, -this.size/2, -this.size/2, this.size/2, this.size/2, this.size/2);
    }
    pop();
  }
}

// --------------------
// Socket events
// --------------------

// initial full state
socket.on("init", (data) => {
  me = data.id;
  experienceState = data.state;
  console.log(experienceState);
});

// someone joined
socket.on("userJoined", (data) => {
  experienceState.users[data.id] = data.user;
});

// someone left
socket.on("userLeft", (id) => {
  delete experienceState.users[id];
});

// someone moved
socket.on("userMoved", (data) => {
  let id = data.id;
  // console.log(data.id,experienceState.users[id]);
  if (experienceState.users[id]) {
    // console.log(data);
    experienceState.users[id].deviceMoves = data.deviceMoves;
    experienceState.users[id].motionData = data.motion;
  }
});