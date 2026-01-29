import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  ListMusic,
  Megaphone,
  Volume2,
  TrendingUp,
  Clock,
  Activity
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatsCard } from '@/components/ui/StatsCard';
import { StoreCard } from '@/components/stores/StoreCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Store as StoreType, PlayerSession, Announcement } from '@/lib/supabase-types';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState<StoreType[]>([]);
  const [sessions, setSessions] = useState<PlayerSession[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
  setLoading(true);
  try {
    const [storesRes, sessionsRes, announcementsRes] = await Promise.all([
      supabase.from('stores').select('*').order('name'),
      supabase.from('player_sessions').select('*'),
      supabase.from('announcements').select('*').eq('is_active', true),
    ]);

    console.log('[Dashboard] stores:', storesRes.data?.length, 'error:', storesRes.error);
    console.log('[Dashboard] sessions:', sessionsRes.data?.length, 'error:', sessionsRes.error);
    console.log('[Dashboard] announcements:', announcementsRes.data?.length, 'error:', announcementsRes.error);
    console.log('✅ DASHBOARD ATUALIZADO EM', new Date().toISOString());

    if (storesRes.data) setStores(storesRes.data as unknown as StoreType[]);
    if (sessionsRes.data) setSessions(sessionsRes.data as unknown as PlayerSession[]);
    if (announcementsRes.data) setAnnouncements(announcementsRes.data as unknown as Announcement[]);
  } catch (error) {
    console.error('Error fetching data:', error);
  } finally {
    setLoading(false);
  }
};


  const getSessionForStore = (storeId: string) => {
    return sessions.find(s => s.store_id === storeId);
  };

  // ✅ PARTE 4: torna o dashboard resistente a last_heartbeat NULL
  const getAlive = (s: any) => {
    const d = s.last_heartbeat || s.last_seen_at;
    const t = d ? new Date(d).getTime() : 0;
    return Number.isFinite(t) ? t : 0;
  };

  const onlineStores = sessions.filter(
    (s) => getAlive(s) > Date.now() - 10000
  ).length;

 const playingStores = sessions.filter(
  (s) => s.is_playing && getAlive(s) > Date.now() - 10000
).length;


  const currentHour = new Date().getHours();
  const period = currentHour < 12 ? 'Manhã' : currentHour < 18 ? 'Tarde' : 'Noite';

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Visão geral do sistema de rádio
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span className="text-sm">Período: {period}</span>
            </div>
            <StatusBadge status="live" label={`${playingStores} tocando`} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total de Lojas"
            value={stores.length}
            subtitle={`${stores.filter(s => s.status === 'active').length} ativas`}
            icon={Store}
            variant="primary"
          />
          <StatsCard
            title="Players Online"
            value={onlineStores}
            subtitle={`de ${stores.length} lojas`}
            icon={Activity}
            variant="success"
          />
          <StatsCard
            title="Avisos Ativos"
            value={announcements.length}
            subtitle="Programados"
            icon={Megaphone}
            variant="warning"
          />
          <StatsCard
            title="Volume Médio"
            value={`${Math.round(stores.reduce((acc, s) => acc + s.default_volume, 0) / stores.length || 0)}%`}
            subtitle="Em todas as lojas"
            icon={Volume2}
          />
        </div>

        {/* Stores Grid */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Lojas</h2>
            <button
              onClick={() => navigate('/stores')}
              className="text-sm text-primary hover:underline"
            >
              Ver todas →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stores.slice(0, 6).map((store) => (
              <StoreCard
                key={store.id}
                store={store as any}
                session={getSessionForStore(store.id)}
                onViewPlayer={() => navigate(`/player?store=${store.id}`)}
                onEdit={() => navigate('/stores')}
              />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="glass-card rounded-xl border p-6">
          <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/stores')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <Store className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium">Gerenciar Lojas</span>
            </button>
            <button
              onClick={() => navigate('/playlists')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <ListMusic className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium">Playlists</span>
            </button>
            <button
              onClick={() => navigate('/announcements')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <Megaphone className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium">Criar Aviso</span>
            </button>
            <button
              onClick={() => navigate('/player')}
              className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
              <Volume2 className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium">Abrir Player</span>
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
