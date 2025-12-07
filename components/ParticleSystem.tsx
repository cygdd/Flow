import React, { useRef, useEffect } from 'react';
import { ShapeType, Particle } from '../types';

interface ParticleSystemProps {
  shape: ShapeType;
  color: string;
  expansion: number; 
  width: number;
  height: number;
}

const PARTICLE_COUNT = 4000;

const ParticleSystem: React.FC<ParticleSystemProps> = ({ shape, color, expansion, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>(0);
  const expansionRef = useRef(expansion);

  useEffect(() => {
    expansionRef.current = expansion;
  }, [expansion]);

  // 核心修复：将初始化和形状计算合并，防止粒子数组为空
  useEffect(() => {
    // 1. 如果没有粒子，先创建粒子
    if (particlesRef.current.length === 0) {
      console.log("Initializing Particles..."); // Debug Log
      const particles: Particle[] = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: width / 2, y: height / 2, z: 0,
          vx: 0, vy: 0, vz: 0,
          lx: 0, ly: 0, lz: 0,
          size: Math.random() * 2 + 1.0,
          color: color,
          alpha: Math.random() * 0.5 + 0.5,
          life: 0,
          maxLife: 100
        });
      }
      particlesRef.current = particles;
    }

    // 2. 计算目标形状 (Geometry)
    const particles = particlesRef.current;
    console.log(`Configuring Shape: ${shape}, Count: ${particles.length}`); // Debug Log

    // 重置物理状态
    particles.forEach(p => {
        p.vx *= 0.1; p.vy *= 0.1; p.vz *= 0.1;
        
        // 烟花特殊处理
        if (shape === ShapeType.FIREWORKS) {
            p.life = Math.random() * 100;
            p.maxLife = 100 + Math.random() * 50;
            p.x = width / 2; p.y = height / 2; p.z = 0;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const speed = Math.random() * 15 + 2;
            p.lx = speed * Math.sin(phi) * Math.cos(theta);
            p.ly = speed * Math.sin(phi) * Math.sin(theta);
            p.lz = speed * Math.cos(phi);
        }
    });

    if (shape === ShapeType.FIREWORKS) return;

    // 计算形状坐标
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const p = particles[i];
        const isShell = Math.random() > 0.1;
        const vol = isShell ? (0.95 + Math.random() * 0.05) : Math.random();

        if (shape === ShapeType.HEART) {
            const u = Math.random() * Math.PI * 2;
            const v = Math.random() * Math.PI;
            const sinU = Math.sin(u); const cosU = Math.cos(u);
            const sinV = Math.sin(v); const cosV = Math.cos(v);
            const hx = 16 * Math.pow(sinU, 3) * sinV;
            const hy = -(13 * cosU - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u));
            const hz = 12 * Math.pow(sinU, 3) * cosV;
            p.lx = hx * vol; p.ly = hy * vol; p.lz = hz * vol;

        } else if (shape === ShapeType.FLOWER) {
            const theta = Math.random() * Math.PI * 2;
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const phi = Math.random() * Math.PI;
            const petalFactor = Math.abs(Math.cos(2.5 * theta));
            const radius = 10 + 15 * Math.pow(petalFactor, 3);
            const cup = (radius / 25) * 10;
            const r = radius * vol;
            p.lx = r * Math.cos(theta);
            p.ly = r * Math.sin(theta);
            p.lz = cup * (Math.random() - 0.5) * 5;
        }
    }

  }, [shape, width, height, color]); 

  // 3. 渲染循环
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 确保画布尺寸匹配
    canvas.width = width;
    canvas.height = height;

    const render = () => {
      // 1. 拖尾效果
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, width, height);
      
      // DEBUG: 如果你看不到粒子，至少应该看到这个红色正方形
      // 如果看到红色正方形，说明 Canvas 正常，只是粒子没画出来
      // 如果看不到红色正方形，说明 Canvas 尺寸或层级有问题
      // ctx.fillStyle = 'red';
      // ctx.fillRect(width / 2 - 5, height / 2 - 5, 10, 10);

      ctx.globalCompositeOperation = 'lighter';

      const currentExpansion = expansionRef.current;
      const centerX = width / 2;
      const centerY = height / 2;
      const scale = (Math.min(width, height) * 0.015) * (1 + currentExpansion * 1.5);

      if (particlesRef.current.length > 0) {
        particlesRef.current.forEach(p => {
            // 简单物理更新
            let tx = centerX;
            let ty = centerY;
            let tz = 0;

            if (shape === ShapeType.FIREWORKS) {
                p.x += p.lx; p.y += p.ly; p.z += p.lz;
                p.lx *= 0.96; p.ly *= 0.96; p.lz *= 0.96;
                p.ly += 0.15;
                p.life -= 1;
                p.alpha = Math.max(0, p.life / 100);
                if (p.life <= 0) {
                    p.life = 100; p.x = centerX; p.y = centerY; p.z = 0;
                    // Reset speed
                    const theta = Math.random() * Math.PI * 2;
                    const phi = Math.acos(2 * Math.random() - 1);
                    const speed = (Math.random() * 15 + 2);
                    p.lx = speed * Math.sin(phi) * Math.cos(theta);
                    p.ly = speed * Math.sin(phi) * Math.sin(theta);
                    p.lz = speed * Math.cos(phi);
                }
            } else {
                tx = centerX + p.lx * scale;
                ty = centerY + p.ly * scale;
                tz = p.lz * scale;
                const dx = tx - p.x; const dy = ty - p.y; const dz = tz - p.z;
                p.vx = (p.vx + dx * 0.2) * 0.80;
                p.vy = (p.vy + dy * 0.2) * 0.80;
                p.vz = (p.vz + dz * 0.2) * 0.80;
                p.x += p.vx; p.y += p.vy; p.z += p.vz;
                p.alpha = 0.8;
            }

            // 绘制
            const focalLength = 800;
            const projectionScale = focalLength / (focalLength + p.z);
            
            if (projectionScale > 0) {
                const size = p.size * projectionScale;
                ctx.beginPath();
                ctx.fillStyle = p.color; // 使用粒子颜色
                ctx.globalAlpha = p.alpha;
                ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        });
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [shape, color, width, height]);

  return (
    <canvas 
      ref={canvasRef} 
      // 显式设置 canvas 属性以防止缩放问题
      width={width}
      height={height}
      className="absolute top-0 left-0 w-full h-full z-10 block"
    />
  );
};

export default ParticleSystem;