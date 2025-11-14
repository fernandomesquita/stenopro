import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className='flex flex-col items-center justify-center py-16 px-4 animate-fade-in-up'>
      <div className='w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mb-6 animate-bounce-subtle'>
        <Icon className='w-10 h-10 text-white' />
      </div>

      <h3 className='text-xl font-semibold text-gray-900 mb-2'>
        {title}
      </h3>

      <p className='text-gray-600 text-center mb-6 max-w-md'>
        {description}
      </p>

      {action && (
        <button
          onClick={action.onClick}
          className='px-6 py-3 bg-gradient-primary text-white rounded-lg font-medium
                   hover:shadow-hover transform hover:scale-105 transition-all duration-200'
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
