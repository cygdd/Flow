
export enum ShapeType {
  HEART = 'HEART',
  FLOWER = 'FLOWER',
  FIREWORKS = 'FIREWORKS'
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  
  // Local Coordinates (The fixed spot on the shape surface)
  lx: number;
  ly: number;
  lz: number;
  
  size: number;
  color: string;
  alpha: number;
  
  // Fireworks specific
  life: number;
  maxLife: number;
}

export interface HandGestureState {
  isHandsDetected: boolean;
  handDistance: number; // Normalized 0-1
  gestureDetected: string | null;
  landmarks: any[];
}
