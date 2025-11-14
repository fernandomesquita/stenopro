import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'outline';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  animate?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = 'info',
  size = 'md',
  animate = false,
  className = ''
}: BadgeProps) {
  const variants = {
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    outline: 'bg-white text-gray-700 border-gray-300',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-medium border
        transition-all duration-200
        ${variants[variant]}
        ${sizes[size]}
        ${animate ? 'animate-pulse-slow' : ''}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
