interface ProgressBarProps {
  progress: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  variant?: 'primary' | 'success' | 'warning';
}

export function ProgressBar({
  progress,
  label,
  showPercentage = true,
  variant = 'primary'
}: ProgressBarProps) {
  const variants = {
    primary: 'bg-gradient-primary',
    success: 'bg-gradient-success',
    warning: 'bg-gradient-secondary',
  };

  return (
    <div className='w-full animate-fade-in'>
      {label && (
        <div className='flex justify-between mb-2'>
          <span className='text-sm font-medium text-gray-700'>{label}</span>
          {showPercentage && (
            <span className='text-sm font-medium text-gray-900'>{Math.round(progress)}%</span>
          )}
        </div>
      )}

      <div className='w-full h-2 bg-gray-200 rounded-full overflow-hidden'>
        <div
          className={`h-full ${variants[variant]} transition-all duration-500 ease-out relative overflow-hidden`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        >
          <div className='absolute inset-0 bg-gradient-shimmer animate-shimmer' />
        </div>
      </div>
    </div>
  );
}
