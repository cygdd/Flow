import React from 'react';
import { ShapeType } from '../types';
import { Heart, Flower, Sparkles, Maximize2, Video, VideoOff } from 'lucide-react';

interface ControlsProps {
  currentShape: ShapeType;
  onShapeChange: (s: ShapeType) => void;
  color: string;
  onColorChange: (c: string) => void;
  handDistance: number;
  detectedGesture: string | null;
  debugMode: boolean;
  onToggleDebug: () => void;
  onToggleFullscreen: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  currentShape,
  onShapeChange,
  color,
  onColorChange,
  handDistance,
  detectedGesture,
  debugMode,
  onToggleDebug,
  onToggleFullscreen
}) => {
  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 
                    bg-black/60 backdrop-blur-md border border-white/10 p-4 rounded-2xl
                    flex flex-col md:flex-row gap-6 items-center shadow-2xl w-[90%] md:w-auto max-w-4xl">
      
      {/* Shape Selectors */}
      <div className="flex gap-4">
        <button 
          onClick={() => onShapeChange(ShapeType.HEART)}
          className={`p-3 rounded-xl transition-all duration-300 flex flex-col items-center gap-1 ${currentShape === ShapeType.HEART ? 'bg-pink-500/20 text-pink-500 border border-pink-500/50' : 'text-gray-400 hover:bg-white/5'}`}
        >
          <Heart fill={currentShape === ShapeType.HEART ? "currentColor" : "none"} />
          <span className="text-xs font-medium">HEART</span>
        </button>
        
        <button 
          onClick={() => onShapeChange(ShapeType.FLOWER)}
          className={`p-3 rounded-xl transition-all duration-300 flex flex-col items-center gap-1 ${currentShape === ShapeType.FLOWER ? 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/50' : 'text-gray-400 hover:bg-white/5'}`}
        >
          <Flower />
          <span className="text-xs font-medium">FLOWER</span>
        </button>

        <button 
          onClick={() => onShapeChange(ShapeType.FIREWORKS)}
          className={`p-3 rounded-xl transition-all duration-300 flex flex-col items-center gap-1 ${currentShape === ShapeType.FIREWORKS ? 'bg-purple-500/20 text-purple-500 border border-purple-500/50' : 'text-gray-400 hover:bg-white/5'}`}
        >
          <Sparkles />
          <span className="text-xs font-medium">FIREWORK</span>
        </button>
      </div>

      <div className="h-10 w-[1px] bg-white/10 hidden md:block"></div>

      {/* Color Picker */}
      <div className="flex flex-col gap-1 items-center">
        <span className="text-xs text-gray-400 uppercase tracking-wider">Color</span>
        <input 
          type="color" 
          value={color}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-10 h-10 rounded-full cursor-pointer bg-transparent border-none p-0 overflow-hidden" 
        />
      </div>

      <div className="h-10 w-[1px] bg-white/10 hidden md:block"></div>

      {/* Info & Toggles */}
      <div className="flex gap-4 items-center">
        <div className="flex flex-col text-xs text-gray-300 w-24">
          <div className="flex justify-between">
            <span>Expansion:</span>
            <span className="font-mono text-white">{(handDistance * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between mt-1 h-4">
             {detectedGesture && (
               <span className="text-yellow-400 animate-pulse font-bold">{detectedGesture}</span>
             )}
          </div>
        </div>

        <button onClick={onToggleDebug} className="p-2 rounded-full hover:bg-white/10 text-gray-300" title="Toggle Hand Skeleton">
           {debugMode ? <Video size={20} className="text-green-400" /> : <VideoOff size={20} />}
        </button>

        <button onClick={onToggleFullscreen} className="p-2 rounded-full hover:bg-white/10 text-gray-300" title="Fullscreen">
           <Maximize2 size={20} />
        </button>
      </div>
    </div>
  );
};

export default Controls;
