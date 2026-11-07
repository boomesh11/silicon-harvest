import React, { useRef, useState } from 'react';

export interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  intensity?: number;
  glareColor?: string;
  elevateZ?: number;
}

export const Card3D: React.FC<Card3DProps> = ({
  children,
  className = '',
  onClick,
  intensity = 7,
  glareColor = 'rgba(0, 245, 160, 0.14)',
  elevateZ = 0,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [transformStyle, setTransformStyle] = useState<string>(
    'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
  );
  const [glarePosition, setGlarePosition] = useState<{
    x: number;
    y: number;
    opacity: number;
  }>({ x: 50, y: 50, opacity: 0 });

  const applyTilt = (clientX: number, clientY: number) => {
    const el = cardRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (((y - centerY) / centerY) * -intensity).toFixed(2);
    const rotateY = (((x - centerX) / centerX) * intensity).toFixed(2);

    setTransformStyle(
      `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.015, 1.015, 1.015)`
    );
    setGlarePosition({
      x: Math.round((x / rect.width) * 100),
      y: Math.round((y / rect.height) * 100),
      opacity: 1,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    applyTilt(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      applyTilt(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleReset = () => {
    setTransformStyle(
      'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)'
    );
    setGlarePosition((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleReset}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleReset}
      style={{
        transform: transformStyle,
        transformStyle: 'preserve-3d',
        transition:
          glarePosition.opacity === 0
            ? 'transform 400ms cubic-bezier(0.22, 1, 0.36, 1)'
            : 'transform 60ms linear',
      }}
      className={`relative overflow-hidden will-change-transform ${className}`}
    >
      {/* Dynamic 3D Specular Glare Reflection */}
      <div
        className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300 rounded-[inherit]"
        style={{
          opacity: glarePosition.opacity,
          background: `radial-gradient(540px circle at ${glarePosition.x}% ${glarePosition.y}%, ${glareColor}, rgba(255, 184, 0, 0.05) 45%, transparent 80%)`,
        }}
      />
      <div
        style={
          elevateZ > 0
            ? {
                transform: `translateZ(${elevateZ}px)`,
                transformStyle: 'preserve-3d',
              }
            : undefined
        }
      >
        {children}
      </div>
    </div>
  );
};

export default Card3D;

