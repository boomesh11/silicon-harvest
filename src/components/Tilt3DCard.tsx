import React, { useRef, useState } from 'react';

interface Tilt3DCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  intensity?: number;
  glareColor?: string;
}

export const Tilt3DCard: React.FC<Tilt3DCardProps> = ({
  children,
  className = '',
  onClick,
  intensity = 6,
  glareColor = 'rgba(0, 245, 160, 0.12)',
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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (((y - centerY) / centerY) * -intensity).toFixed(2);
    const rotateY = (((x - centerX) / centerX) * intensity).toFixed(2);

    setTransformStyle(
      `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.012, 1.012, 1.012)`
    );
    setGlarePosition({
      x: Math.round((x / rect.width) * 100),
      y: Math.round((y / rect.height) * 100),
      opacity: 1,
    });
  };

  const handleMouseLeave = () => {
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
      onMouseLeave={handleMouseLeave}
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
      {/* Dynamic Specular Surface Lighting */}
      <div
        className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300 rounded-[inherit]"
        style={{
          opacity: glarePosition.opacity,
          background: `radial-gradient(520px circle at ${glarePosition.x}% ${glarePosition.y}%, ${glareColor}, rgba(255, 184, 0, 0.04) 45%, transparent 80%)`,
        }}
      />
      {children}
    </div>
  );
};
