/*

Sketch Name: PopCat Remote Controller
Date: Feb 5, 2026
Made by: Zihan Mei (zmei001), Yi-Ho Li (yli102)

Reference:
  1. MobileDeviceOrientation by beckyaston 
  (https://editor.p5js.org/beckyaston/sketches/5wtxAxSpZ)
  
  2. Nature of Code, Chapter 5: Autonomous Agents
  (https://natureofcode.com/)
  
  3. Images of the Pop Cat 
  (https://popcat.click/)

Generative AI Use Statement:
I acknowledge the use of Google Gemini(https://gemini.google.com/share/71bef38391e1) to debug code and to explain code. All parameters and values have been tested and adjusted by the author.

*/


let askButton;
const socket = io();  // initialize socket -Zihan

// device motion
let accX = 0;
let accY = 0; 
let accZ = 0;
let rrateX = 0;
let rrateY = 0; 
let rrateZ = 0;

let x;
let y;

let catFoodFollowers = [];

let catEatImage;
let catSmileImage;
let isMouthOpen = true; // Default state: mouth open (catEatImage)


// device orientation
let rotateDegrees = 0;
let frontToBack = 0; 
let leftToRight = 0; 

function preload() {
  catEatImage = loadImage('popcat_eat.png');
  catSmileImage = loadImage('popcat_smile.png');
}


function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent("sketch-container"); 
  rectMode(CENTER);
  angleMode(DEGREES);
  
  x = width/2
  y = height/2
  
  for (let i = 0; i < 10; i++) {
    catFoodFollowers.push(new Catfood(random(width), random(height)));
  }
  
  //----------
  if(typeof DeviceMotionEvent.requestPermission === 'function' && typeof DeviceOrientationEvent.requestPermission === 'function'){
    // iOS 13+
    askButton = createButton('Permission');//p5 create button
    askButton.mousePressed(handlePermissionButtonPressed);//p5 listen to mousePressed event
  }else{
    //if there is a device that doesn't require permission
    window.addEventListener('devicemotion', deviceMotionHandler, true);
    window.addEventListener('deviceorientation', deviceTurnedHandler, true)
  }
  
  imageMode(CENTER);
  
}

//we are using p5.js to visualise this movement data
function draw() {
  
  // // Get the maximum tilt value and map it to a grayscale color (0-100)
  let tilt = max(abs(frontToBack), abs(leftToRight));
  let bgGray = map(tilt, 0, 45, 0, 100); 
  background(bgGray);


  //Creating a tilt sensor mechanic that has a sort of boolean logic (on or off)
  //if the phone is rotated front/back/left/right we will get an arrow point in that direction 
  push();
  translate(width - 60, 50);
 
  if(frontToBack > 1){ //down
    push();
    fill(100);
    rotate(-180);
    triangle(-15, -20, 0, -40, 15, -20);
    pop();
    
    
  }else if(frontToBack < -1){ //top
    push();
    fill(100);
    triangle(-15, -20, 0, -40, 15, -20);
    pop();
  }
  
  if(leftToRight > 1){ //right
    push();
    fill(100);
    rotate(90);
    triangle(-15, -20, 0, -40, 15, -20);
    pop();
  }else if(leftToRight < -1){//left
    push();
    fill(100);
    rotate(-90);
    triangle(-15, -20, 0, -40, 15, -20);
    pop();
  }
  pop();
  
  //Debug text
  fill(200);
  textSize(10);
  
  text("acceleration: ",10,20);
  text(accX.toFixed(2) +", "+accY.toFixed(2)+", "+accZ.toFixed(2),10,30);

  text("rotation rate: ",10,50);
  text(rrateX.toFixed(2) +", "+rrateY.toFixed(2)+", "+rrateZ.toFixed(2),10,60);
  
  
  text("device orientation: ",10,80);
  text(rotateDegrees.toFixed(2) +", "+leftToRight.toFixed(2) +", "+frontToBack.toFixed(2),10,90);  
  
  
  let currentlyEating = isMouthOpen;
  
  // Updated movement handling -- Zihan
  x += (leftToRight / 90) * 5;
  y += (frontToBack / 90) * 5;

  
  x = constrain(x, 0, width);  
  y = constrain(y, 0, height);
  
  let target = createVector(x + 30, y + 10);
  
  // emit data to server -- Zihan
  if (frameCount % 2 === 0) {
    socket.emit('cursor-update', {
      x: x / width,
      y: y / height
    });
  }  
  

  if (currentlyEating) {
    if (catEatImage) image(catEatImage, x, y, 150, 150);
  } else {
    if (catSmileImage) image(catSmileImage, x, y, 150, 150);
  }
      
  for (let f of catFoodFollowers) {
    if (currentlyEating) {
      f.arrive(target);    // Calculate the force to follow the cat
      f.update();          // Update position based on force
      f.checkEat(target);  // Check if the catFoodFollowers is eaten
    }
    
    f.display();
  }
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


class Catfood {
  constructor(x, y) {
    this.position = createVector(x, y);
    this.velocity = createVector(0, 0);
    this.acceleration = createVector(0, 0);
    this.maxspeed = random(2, 6); 
    this.maxforce = random(0.1, 0.3);
    this.reset(); 
  }
  
  //Check if the food is close enough to be "eaten"
  checkEat(target) {
    let d = p5.Vector.dist(this.position, target);
    if (d < 20) { //set the mouth space to be checked
      this.reset();
    }
  }

  // Reset the food to a random side of the screen
  reset() {
    //Pick a random side: 0 = Top, 1 = Bottom, 2 = Left, 3 = Right
    let side = floor(random(4));
    if (side === 0) this.position = createVector(random(width), -20);
    else if (side === 1) this.position = createVector(random(width), height + 20);
    else if (side === 2) this.position = createVector(-20, random(height));
    else this.position = createVector(width + 20, random(height));
    
    // Set a random color with 180 transparency
    this.color = color(random(255), random(255), random(255), 180);
    // Pick a random size for the food circle
    this.size = random(10, 25);
  }

  // Steering logic to follow the target
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

  // Move the food
  update() {
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxspeed);
    this.position.add(this.velocity);
    this.acceleration.mult(0);
  }

  // Draw the food
  display() {
    fill(this.color);
    noStroke();
    push();
    translate(this.position.x, this.position.y);
    circle(0, 0, this.size);
    
    pop();
  }
}

//Touch or click functions to change the mouth status
// mobile-compatible -- Zihan
function touchStarted() {
  isMouthOpen = false;
  socket.emit('cursor-down');
  return false;
}

function touchEnded() {
  isMouthOpen = true;
  socket.emit('cursor-up');
  return false;
}
// desktop
function mousePressed() {
  isMouthOpen = false; //Change to "catEatImage"
  socket.emit('cursor-down');
}

function mouseReleased() {
  isMouthOpen = true; //Change back to "catEatImage"
  socket.emit('cursor-up');
}

// SOCKETS -- Zihan

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