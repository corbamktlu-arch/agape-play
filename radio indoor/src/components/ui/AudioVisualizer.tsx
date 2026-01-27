import { cn } from '@/lib/utils';

interface AudioVisualizerProps {
  isPlaying: boolean;
  className?: string;
  bars?: number;
}

export function AudioVisualizer({ isPlaying, className, bars = 5 }: AudioVisualizerProps) {
  return (
    <div className={cn('flex items-end gap-1 h-8', className)}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'w-1 rounded-full transition-all duration-200',
            isPlaying ? 'bg-primary audio-bar' : 'bg-muted h-1'
          )}
          style={{
            animationDelay: `${i * 0.15}s`,
            height: isPlaying ? undefined : '4px',
          }}
        />
      ))}
    </div>
  );
}
