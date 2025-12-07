import React, { useEffect, useRef, useState } from 'react';
import ParticleSystem from './components/ParticleSystem';
import Controls from './components/Controls';
import { initializeHandLandmarker, detectHands, drawHandSkeleton, detectWaveGesture } from './services/handTracker';
import { ShapeType } from './types';

const App: React.FC = () => {
  // State
  const [shape, setShape] = useState<ShapeType>(ShapeType.HEART);
  const [color, setColor] = useState<string>('#ff007f'); 
  const [expansion, setExpansion] = useState<number>(0);
  const [detectedGesture, setDetectedGesture] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState<boolean>(true);
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const debugCanvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const isCameraReady = useRef(false);
  const isInitializing = useRef(false); 

  // Resize handler
  useEffect(() => {
    const handleResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize MediaPipe & Camera
  useEffect(() => {
    if (isInitializing.current) return;
    isInitializing.current = true;

    let ignore = false; 

    const startCamera = async () => {
      try {
        await initializeHandLandmarker();
        if (ignore) return;
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: { ideal: 640 },
                height: { ideal: 480 },
                frameRate: { ideal: 30 }
            } 
        });
        
        if (ignore) {
            stream.getTracks().forEach(track => track.stop());
            return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (ignore) return;
            videoRef.current!.play().then(() => {
                isCameraReady.current = true;
                processVideo();
            }).catch(e => console.error("Play error:", e));
          };
        }
      } catch (err) {
        console.error("Camera init failed:", err);
        setDetectedGesture("Camera Error: Check Permissions");
      }
    };

    startCamera();
    
    return () => {
      ignore = true;
      isInitializing.current = false; 
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const switchShapeSequence = (current: ShapeType): ShapeType => {
    if (current === ShapeType.HEART) return ShapeType.FLOWER;
    if (current === ShapeType.FLOWER) return ShapeType.FIREWORKS;
    return ShapeType.HEART;
  };

  const processVideo = () => {
    if (!videoRef.current || !isCameraReady.current) return;

    const video = videoRef.current;
    
    if (video.readyState >= 2) {
        if (debugCanvasRef.current) {
            const canvas = debugCanvasRef.current;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const detection = detectHands(video);
                
                if (detection && detection.landmarks.length > 0) {
                  if (debugMode) {
                    drawHandSkeleton(ctx, detection);
                  }

                  let targetExpansion = 0;
                  if (detection.landmarks.length === 2) {
                    const hand1 = detection.landmarks[0][0];
                    const hand2 = detection.landmarks[1][0];
                    const dist = Math.sqrt(Math.pow(hand1.x - hand2.x, 2) + Math.pow(hand1.y - hand2.y, 2));
                    targetExpansion = Math.max(0, Math.min(1, (dist - 0.2) * 2));
                  } else if (detection.landmarks.length === 1) {
                     const hand = detection.landmarks[0];
                     const thumb = hand[4];
                     const index = hand[8];
                     const dist = Math.sqrt(Math.pow(thumb.x - index.x, 2) + Math.pow(thumb.y - index.y, 2));
                     targetExpansion = Math.max(0, Math.min(1, (dist - 0.05) * 6));
                  }
                  
                  setExpansion(prev => prev + (targetExpansion - prev) * 0.05);

                  const isWave = detectWaveGesture(detection.landmarks);
                  if (isWave) {
                     setDetectedGesture("👋 Wave Detected!");
                     setShape(prev => switchShapeSequence(prev));
                     setColor(prev => {
                        if(prev === '#ff007f') return '#00f3ff';
                        if(prev === '#00f3ff') return '#9d00ff';
                        return '#ff007f';
                     });
                     setTimeout(() => setDetectedGesture(null), 2000);
                  }

                } else {
                    setExpansion(prev => prev * 0.95);
                }
            }
        }
    }
    
    requestRef.current = requestAnimationFrame(processVideo);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  return (
    // 关键修改：h-full 改为 h-screen，w-full 改为 w-screen
    // 强制使用屏幕尺寸，防止父级元素高度塌陷
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none font-sans">
      
      {/* Visual Layer */}
      <ParticleSystem 
        shape={shape} 
        color={color} 
        expansion={expansion}
        width={dimensions.width}
        height={dimensions.height}
      />

      {/* Debug Overlay */}
      <div className={`absolute top-4 right-4 z-40 transition-all duration-300 ${debugMode ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}>
         <div className="relative border border-white/20 rounded-lg overflow-hidden bg-black/80 backdrop-blur shadow-lg w-64 h-48">
            <video 
              ref={videoRef} 
              playsInline 
              muted 
              className="absolute top-0 left-0 w-full h-full object-cover transform scale-x-[-1] opacity-80"
            />
            <canvas 
              ref={debugCanvasRef}
              width={640}
              height={480}
              className="absolute top-0 left-0 w-full h-full transform scale-x-[-1]"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 text-center">
              DEBUG: SKELETON & GESTURE
            </div>
         </div>
         <div className="text-white/60 text-xs mt-2 text-right px-1">
           {detectedGesture ? <span className="text-green-400 font-bold animate-pulse">{detectedGesture}</span> : "Wave hand to switch shape"}
         </div>
      </div>

      <div className="absolute top-8 left-8 z-30 pointer-events-none opacity-80">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 animate-pulse">
              PARTICLE FLOW
          </h1>
          <p className="text-white/50 text-sm mt-1">Interactive Gesture System</p>
      </div>

      <Controls 
        currentShape={shape} 
        onShapeChange={setShape}
        color={color}
        onColorChange={setColor}
        handDistance={expansion}
        detectedGesture={detectedGesture}
        debugMode={debugMode}
        onToggleDebug={() => setDebugMode(!debugMode)}
        onToggleFullscreen={toggleFullscreen}
      />
      
    </div>
  );
};

export default App;