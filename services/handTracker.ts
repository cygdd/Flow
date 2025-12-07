import { FilesetResolver, HandLandmarker, DrawingUtils } from "@mediapipe/tasks-vision";

let handLandmarker: HandLandmarker | undefined = undefined;
let lastVideoTime = -1;

// Improved Wave/Swipe detection state
const waveState = {
  lastX: 0,
  velocityX: 0,
  consecutiveFrames: 0,
  direction: 0, // -1 left, 1 right
  lastTriggerTime: 0,
  cooldown: 1000,
  threshold: 0.02 // Sensitivity threshold (normalized screen coordinates)
};

export const initializeHandLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "GPU"
    },
    runningMode: "VIDEO",
    numHands: 2,
    minHandDetectionConfidence: 0.5,
    minHandPresenceConfidence: 0.5,
    minTrackingConfidence: 0.5
  });
};

export const detectHands = (video: HTMLVideoElement) => {
  if (!handLandmarker) return null;

  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    const results = handLandmarker.detectForVideo(video, performance.now());
    return results;
  }
  return null;
};

// Simplified and more sensitive Wave/Swipe detection
export const detectWaveGesture = (landmarks: any[][]): boolean => {
  if (!landmarks || landmarks.length === 0) return false;

  // Use the centroid of the first hand
  const hand = landmarks[0];
  // Average x of wrist(0), index(5), pinky(17) for stability
  const currentX = (hand[0].x + hand[5].x + hand[17].x) / 3;
  const now = Date.now();

  if (now - waveState.lastTriggerTime < waveState.cooldown) {
    waveState.lastX = currentX;
    return false;
  }

  const dx = currentX - waveState.lastX;
  waveState.lastX = currentX;

  // Check movement speed/direction
  if (Math.abs(dx) > waveState.threshold) {
    const currentDirection = dx > 0 ? 1 : -1;
    
    // If direction changed (switched from left-to-right or vice versa)
    // AND we had some momentum in the previous direction
    if (waveState.direction !== 0 && currentDirection !== waveState.direction) {
       // A change in direction implies a wave peak/valley
       // We count "swipes" or "direction flips"
       // But for instant gratification, let's just check if we covered enough distance recently
       // Simplest robust "Wave": Just detecting high velocity direction changes
       waveState.lastTriggerTime = now;
       waveState.direction = currentDirection;
       return true; 
    }
    
    waveState.direction = currentDirection;
  }

  // Backup: Simple high-velocity swipe detection
  if (Math.abs(dx) > 0.08) { // Fast movement
      waveState.lastTriggerTime = now;
      return true;
  }

  return false;
};

export const drawHandSkeleton = (ctx: CanvasRenderingContext2D, result: any) => {
  if (!result || !result.landmarks) return;
  
  const width = ctx.canvas.width;
  const height = ctx.canvas.height;

  // Removed unused DrawingUtils instantiation to clean up
  
  for (const landmarks of result.landmarks) {
    // We need to verify if DrawingUtils automatically handles scaling or expects normalized 0-1.
    // MediaPipe DrawingUtils usually expects normalized landmarks if not transformed? 
    // Actually, DrawingUtils.drawConnectors takes landmarks and options.
    // If landmarks are 0-1, DrawingUtils MIGHT NOT scale them automatically unless configured?
    // Let's do manual drawing for 100% control and reliability since the user reported bugs.
    
    const points = landmarks.map((l: any) => ({
        x: l.x * width,
        y: l.y * height
    }));

    // Draw Connections
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#00f3ff";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const connections = HandLandmarker.HAND_CONNECTIONS;
    
    // HandLandmarker.HAND_CONNECTIONS contains objects {start: number, end: number}
    for (const { start, end } of connections) {
        const p1 = points[start];
        const p2 = points[end];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    }

    // Draw Points
    ctx.fillStyle = "#ff007f";
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    for (const p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
    }
  }
};