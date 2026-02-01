import { Store, Volume2, MapPin, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AudioVisualizer } from '@/components/ui/AudioVisualizer';
import { cn } from '@/lib/utils';
import type { Store as StoreType, PlayerSession } from '@/lib/supabase-types';

interface StoreCardProps {
  store: StoreType;
  session?: PlayerSession | null;
  onEdit?: () => void;
  onViewPlayer?: () => void;
}

// ✅ mantenha igual ao Dashboard (offline rápido quando player fecha)
const ONLINE_WINDOW_MS = 25_000;

export function StoreCard({ store, session, onEdit, onViewPlayer }: StoreCardProps) {
  // ✅ resistente a last_heartbeat null
  const getAliveMs = (s: any) => {
    const d = s?.last_heartbeat || s?.last_seen_at || null;
    const t = d ? new Date(d).getTime() : 0;
    return Number.isFinite(t) ? t : 0;
  };

  const isOnline = !!session && getAliveMs(session as any) > Date.now() - ONLINE_WINDOW_MS;

  // ✅ tocando se estiver online E (is_playing true OU status == playing)
  const isPlaying = isOnline && (((session as any)?.is_playing === true) || ((session as any)?.status === 'playing'));

  return (
    <div
      className={cn(
        'glass-card rounded-xl border p-6 transition-all duration-300',
        'hover:shadow-lg hover:border-primary/20',
        isPlaying && 'border-primary/30 shadow-glow'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'p-3 rounded-lg',
              isPlaying ? 'bg-primary/20' : 'bg-muted'
            )}
          >
            <Store
              className={cn(
                'w-6 h-6',
                isPlaying ? 'text-primary' : 'text-muted-foreground'
              )}
            />
          </div>

          <div>
            <h3 className="font-semibold text-foreground">{store.name}</h3>
            <p className="text-sm text-muted-foreground font-mono">{store.code}</p>
          </div>
        </div>

        <StatusBadge status={isOnline ? (isPlaying ? 'live' : 'online') : 'offline'} />
      </div>

      {/* Info */}
      {store.address && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <MapPin className="w-4 h-4" />
          <span className="truncate">{store.address}</span>
        </div>
      )}

      {/* Volume & Status */}
      <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-muted/50">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {(session as any)?.current_volume ?? (store as any).default_volume}%
          </span>
        </div>
        <AudioVisualizer isPlaying={!!isPlaying} bars={4} />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          onClick={onViewPlayer}
        >
          Abrir Player
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
