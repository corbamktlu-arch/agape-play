// Custom types for the Ágape play system
// These complement the auto-generated types from Supabase

export type StoreStatus = 'active' | 'inactive';
export type AnnouncementTarget = 'individual' | 'group' | 'global';
export type DayPeriod = 'morning' | 'afternoon' | 'night';
export type AppRole = 'admin' | 'manager' | 'operator';
export type AccountStatus = 'active' | 'suspended';
export type AnnouncementFrequency = '15min' | '30min' | '1hour';

export interface Store {
  id: string;
  name: string;
  code: string;
  status: StoreStatus;
  default_volume: number;
  address: string | null;
  manager_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string | null;
  is_global: boolean;
  store_id: string | null;
  period: DayPeriod | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string | null;
  duration_seconds: number | null;
  file_url: string;
  file_size: number | null;
  genre: string | null;
  created_at: string;
}

export interface PlaylistTrack {
  id: string;
  playlist_id: string;
  track_id: string;
  position: number;
  last_played_at: string | null;
  play_count: number;
  created_at: string;
  track?: Track;
}

export interface Announcement {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  duration_seconds: number | null;
  target_type: AnnouncementTarget;
  priority: number;
  category: string | null;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  stores?: Store[];
}

export interface AnnouncementStore {
  id: string;
  announcement_id: string;
  store_id: string;
  created_at: string;
}

export interface AnnouncementSchedule {
  id: string;
  announcement_id: string;
  scheduled_time: string;
  days_of_week: number[];
  is_active: boolean;
  frequency: AnnouncementFrequency;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface StoreSchedule {
  id: string;
  store_id: string;
  playlist_id: string | null;
  period: DayPeriod;
  start_time: string;
  end_time: string;
  use_global: boolean;
  is_active: boolean;
  created_at: string;
  playlist?: Playlist;
}

export interface PlayerSession {
  id: string;
  store_id: string;
  current_volume: number;
  is_playing: boolean;
  current_track_id: string | null;
  last_heartbeat: string;
  connected_at: string;
  store?: Store;
  current_track?: Track;
}

export interface PlaybackLog {
  id: string;
  store_id: string;
  track_id: string | null;
  announcement_id: string | null;
  played_at: string;
  type: 'track' | 'announcement';
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  account_status: AccountStatus;
  suspended_reason: string | null;
  suspended_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  created_at: string;
}

export interface UserStoreAssignment {
  id: string;
  user_id: string;
  store_id: string;
  created_at: string;
}

// Helper functions
export const getPeriodLabel = (period: DayPeriod): string => {
  const labels: Record<DayPeriod, string> = {
    morning: 'Manhã',
    afternoon: 'Tarde',
    night: 'Noite',
  };
  return labels[period];
};

export const getTargetLabel = (target: AnnouncementTarget): string => {
  const labels: Record<AnnouncementTarget, string> = {
    individual: 'Individual',
    group: 'Grupo',
    global: 'Global',
  };
  return labels[target];
};

export const getStatusLabel = (status: StoreStatus): string => {
  const labels: Record<StoreStatus, string> = {
    active: 'Ativa',
    inactive: 'Inativa',
  };
  return labels[status];
};

export const getAccountStatusLabel = (status: AccountStatus): string => {
  const labels: Record<AccountStatus, string> = {
    active: 'Ativa',
    suspended: 'Suspensa',
  };
  return labels[status];
};

export const getRoleLabel = (role: AppRole): string => {
  const labels: Record<AppRole, string> = {
    admin: 'Administrador',
    manager: 'Gerente',
    operator: 'Operador',
  };
  return labels[role];
};

export const getFrequencyLabel = (frequency: AnnouncementFrequency): string => {
  const labels: Record<AnnouncementFrequency, string> = {
    '15min': 'A cada 15 minutos',
    '30min': 'A cada 30 minutos',
    '1hour': 'A cada 1 hora',
  };
  return labels[frequency];
};

export const formatDuration = (seconds: number | null): string => {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
