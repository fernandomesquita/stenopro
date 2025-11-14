import React from 'react';

interface CardProps {
  children: React.ReactNode;
  hover?: boolean;
  elevated?: boolean;
  glass?: boolean;
  className?: string;
  onClick?: () => void;
}

export function Card({
  children,
  hover = true,
  elevated = false,
  glass = false,
  className = '',
  onClick
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-lg border
        ${glass ? 'backdrop-blur-lg bg-opacity-80 border-white/20 shadow-glass' : 'shadow-soft'}
        ${elevated ? 'shadow-elevated' : ''}
        ${hover ? 'transition-all duration-300 hover:shadow-hover hover:-translate-y-1 cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
