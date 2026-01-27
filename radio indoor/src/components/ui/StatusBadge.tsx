import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: 'live' | 'online' | 'offline' | 'active' | 'inactive';
  label?: string;
  showDot?: boolean;
  className?: string;
}

export function StatusBadge({ status, label, showDot = true, className }: StatusBadgeProps) {
  const statusConfig = {
    live: {
      label: 'AO VIVO',
      className: 'status-badge-live',
      dotClass: 'bg-red-500 animate-pulse',
    },
    online: {
      label: 'Online',
      className: 'status-badge-online',
      dotClass: 'bg-green-500',
    },
    offline: {
      label: 'Offline',
      className: 'status-badge-offline',
      dotClass: 'bg-gray-500',
    },
    active: {
      label: 'Ativa',
      className: 'status-badge-online',
      dotClass: 'bg-green-500',
    },
    inactive: {
      label: 'Inativa',
      className: 'status-badge-offline',
      dotClass: 'bg-gray-500',
    },
  };

  const config = statusConfig[status];

  return (
    <span 
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium',
        config.className,
        className
      )}
    >
      {showDot && (
        <span className={cn('w-2 h-2 rounded-full', config.dotClass)} />
      )}
      {label || config.label}
    </span>
  );
}
