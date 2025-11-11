interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="glass-card backdrop-blur-md bg-white/20 rounded-full p-3">
        <div
          className={`animate-spin rounded-full border-2 border-white/30 border-t-white ${sizeClasses[size]}`}
        />
      </div>
    </div>
  );
}

export default LoadingSpinner;

