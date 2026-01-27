import { Volume, Volume1, Volume2, VolumeX } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface VolumeControlProps {
  volume: number;
  onChange: (value: number) => void;
  className?: string;
  showLabel?: boolean;
}

export function VolumeControl({ volume, onChange, className, showLabel = true }: VolumeControlProps) {
  const getVolumeIcon = () => {
    if (volume === 0) return VolumeX;
    if (volume < 33) return Volume;
    if (volume < 66) return Volume1;
    return Volume2;
  };

  const VolumeIcon = getVolumeIcon();

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <VolumeIcon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      <Slider
        value={[volume]}
        min={0}
        max={100}
        step={1}
        onValueChange={(values) => onChange(values[0])}
        className="flex-1"
      />
      {showLabel && (
        <span className="text-sm font-mono text-muted-foreground w-10 text-right">
          {volume}%
        </span>
      )}
    </div>
  );
}
