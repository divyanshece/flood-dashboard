'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  wobble: number;
  wobbleSpeed: number;
}

interface WaterParticlesProps {
  count?: number;
  color?: string;
  maxSize?: number;
  minSize?: number;
  className?: string;
}

export function WaterParticles({
  count = 50,
  color = 'var(--accent-primary)',
  maxSize = 8,
  minSize = 2,
  className = '',
}: WaterParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const animationRef = useRef<number | null>(null);

  const initParticles = useCallback((width: number, height: number) => {
    particlesRef.current = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      size: minSize + Math.random() * (maxSize - minSize),
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: -0.2 - Math.random() * 0.5,
      opacity: 0.1 + Math.random() * 0.4,
      wobble: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03,
    }));
  }, [count, maxSize, minSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
      initParticles(rect.width, rect.height);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        active: true,
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    const getColor = () => {
      // Parse CSS variable or return the color directly
      const temp = document.createElement('div');
      temp.style.color = color;
      document.body.appendChild(temp);
      const computedColor = getComputedStyle(temp).color;
      document.body.removeChild(temp);
      return computedColor;
    };

    const particleColor = getColor();

    const animate = () => {
      const rect = container.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      particlesRef.current.forEach((particle) => {
        // Update wobble
        particle.wobble += particle.wobbleSpeed;

        // Apply mouse influence
        if (mouseRef.current.active) {
          const dx = mouseRef.current.x - particle.x;
          const dy = mouseRef.current.y - particle.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 150;

          if (dist < maxDist) {
            const force = (1 - dist / maxDist) * 0.5;
            particle.speedX -= (dx / dist) * force;
            particle.speedY -= (dy / dist) * force;
          }
        }

        // Add wobble to movement
        particle.x += particle.speedX + Math.sin(particle.wobble) * 0.3;
        particle.y += particle.speedY + Math.cos(particle.wobble) * 0.1;

        // Dampen speed
        particle.speedX *= 0.99;
        particle.speedY *= 0.99;

        // Reset if out of bounds
        if (particle.y < -particle.size * 2) {
          particle.y = rect.height + particle.size;
          particle.x = Math.random() * rect.width;
          particle.speedY = -0.2 - Math.random() * 0.5;
        }
        if (particle.x < -particle.size * 2) particle.x = rect.width + particle.size;
        if (particle.x > rect.width + particle.size * 2) particle.x = -particle.size;

        // Draw particle with glow
        const gradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.size * 2
        );

        // Extract RGB from computed color
        const rgbMatch = particleColor.match(/\d+/g);
        if (rgbMatch) {
          const [r, g, b] = rgbMatch;
          gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${particle.opacity})`);
          gradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${particle.opacity * 0.5})`);
          gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
        }

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright core
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity * 0.8})`;
        ctx.arc(particle.x, particle.y, particle.size * 0.3, 0, Math.PI * 2);
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [color, initParticles]);

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden pointer-events-auto ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0" />
    </div>
  );
}

// Wave Divider Component
interface WaveDividerProps {
  position?: 'top' | 'bottom';
  flip?: boolean;
  className?: string;
  variant?: 'default' | 'subtle' | 'dramatic';
}

export function WaveDivider({
  position = 'bottom',
  flip = false,
  className = '',
  variant = 'default',
}: WaveDividerProps) {
  const heights = {
    default: { h1: 120, h2: 100, h3: 80 },
    subtle: { h1: 80, h2: 60, h3: 40 },
    dramatic: { h1: 180, h2: 150, h3: 120 },
  };

  const { h1, h2, h3 } = heights[variant];

  return (
    <div
      className={`absolute left-0 right-0 overflow-hidden pointer-events-none ${className}`}
      style={{
        [position]: 0,
        transform: flip ? 'scaleY(-1)' : 'none',
        zIndex: 1,
      }}
    >
      {/* Back wave - slowest */}
      <svg
        className="wave-animation-slow absolute bottom-0 w-[200%]"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        style={{ height: h1, opacity: 0.15 }}
      >
        <path
          fill="var(--accent-primary)"
          d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>

      {/* Middle wave - medium speed */}
      <svg
        className="wave-animation-medium absolute bottom-0 w-[200%]"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        style={{ height: h2, opacity: 0.25 }}
      >
        <path
          fill="var(--accent-secondary)"
          d="M0,256L48,240C96,224,192,192,288,181.3C384,171,480,181,576,208C672,235,768,277,864,277.3C960,277,1056,235,1152,208C1248,181,1344,171,1392,165.3L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>

      {/* Front wave - fastest */}
      <svg
        className="wave-animation-fast absolute bottom-0 w-[200%]"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        style={{ height: h3, opacity: 0.4 }}
      >
        <path
          fill="var(--accent-tertiary)"
          d="M0,288L48,272C96,256,192,224,288,213.3C384,203,480,213,576,229.3C672,245,768,267,864,261.3C960,256,1056,224,1152,213.3C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        />
      </svg>
    </div>
  );
}

// Ripple Effect Hook
export function useRipple() {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const createRipple = useCallback((event: React.MouseEvent<HTMLElement>) => {
    const element = event.currentTarget;
    const rect = element.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);

    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== id));
    }, 800);
  }, []);

  const RippleContainer = useCallback(
    () => (
      <span className="absolute inset-0 overflow-hidden rounded-inherit pointer-events-none">
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full ripple-animation"
            style={{
              left: ripple.x,
              top: ripple.y,
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 70%)',
            }}
          />
        ))}
      </span>
    ),
    [ripples]
  );

  return { createRipple, RippleContainer };
}

// Flowing Water Background Component
interface FlowingWaterProps {
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export function FlowingWater({ className = '', intensity = 'medium' }: FlowingWaterProps) {
  const opacityMap = { low: 0.03, medium: 0.06, high: 0.1 };
  const opacity = opacityMap[intensity];

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Primary flow */}
      <div
        className="absolute inset-0 water-flow-1"
        style={{
          background: `
            linear-gradient(
              45deg,
              transparent 0%,
              rgba(59, 130, 246, ${opacity}) 25%,
              transparent 50%,
              rgba(6, 182, 212, ${opacity}) 75%,
              transparent 100%
            )
          `,
          backgroundSize: '400% 400%',
        }}
      />

      {/* Secondary flow - counter direction */}
      <div
        className="absolute inset-0 water-flow-2"
        style={{
          background: `
            linear-gradient(
              -45deg,
              transparent 0%,
              rgba(139, 92, 246, ${opacity * 0.7}) 30%,
              transparent 60%,
              rgba(59, 130, 246, ${opacity * 0.7}) 80%,
              transparent 100%
            )
          `,
          backgroundSize: '300% 300%',
        }}
      />

      {/* Caustic light effect */}
      <div
        className="absolute inset-0 caustic-effect"
        style={{
          background: `
            radial-gradient(ellipse at 20% 30%, rgba(255, 255, 255, ${opacity * 0.8}) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, rgba(255, 255, 255, ${opacity * 0.6}) 0%, transparent 40%),
            radial-gradient(ellipse at 50% 50%, rgba(255, 255, 255, ${opacity * 0.4}) 0%, transparent 60%)
          `,
        }}
      />
    </div>
  );
}

// Water Droplet Icon Component
export function WaterDroplet({ className = '', animated = true }: { className?: string; animated?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`${className} ${animated ? 'droplet-bounce' : ''}`}
    >
      <defs>
        <linearGradient id="dropletGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-primary)" />
          <stop offset="100%" stopColor="var(--accent-secondary)" />
        </linearGradient>
      </defs>
      <path
        d="M12 2C12 2 5 10 5 14.5C5 18.09 8.13 21 12 21C15.87 21 19 18.09 19 14.5C19 10 12 2 12 2Z"
        fill="url(#dropletGradient)"
        opacity="0.9"
      />
      <ellipse cx="9" cy="13" rx="2" ry="2.5" fill="white" opacity="0.4" />
    </svg>
  );
}
