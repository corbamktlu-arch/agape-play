import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Store,
  ListMusic,
  Megaphone,
  Volume2,
  Clock,
  Activity,
} from "lucide-react";

import { MainLayout } from "@/components/layout/MainLayout";
import { StatsCard } from "@/components/ui/StatsCard";
import { StoreCard } from "@/components/stores/StoreCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type {
  Store as StoreType,
  PlayerSession,
  Announcement,
} from "@/lib/supabase-types";

/** ✅ Offline rápido em 25s */
const ONLINE_WINDOW_MS = 60_000;

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [stores, setStores] = useState<StoreType[]>([]);
  const [sessions, setSessions] = useState<PlayerSession[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  /** ✅ (NOVO) força re-render a cada 1s (sem refetch no Supabase) */
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => (t + 1) % 1_000_000);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  /** ✅ Se não estiver logado */
  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  /** ✅ Carrega tudo uma vez */
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);

      const [storesRes, sessionsRes, announcementsRes] = await Promise.all([
        supabase.from("stores").select("*").order("name"),
        supabase.from("player_sessions").select("*"),
        supabase.from("announcements").select("*").eq("is_active", true),
      ]);

      if (storesRes.data) setStores(storesRes.data as any);
      if (sessionsRes.data) setSessions(sessionsRes.data as any);
      if (announcementsRes.data) setAnnouncements(announcementsRes.data as any);

      setLoading(false);
    };

    fetchData();
  }, [user]);

  /** ✅ Último sinal de vida */
  const getAliveMs = (s: any) => {
    const d = s?.last_heartbeat || s?.last_seen_at;
    const t = d ? new Date(d).getTime() : 0;
    return Number.isFinite(t) ? t : 0;
  };

  /** ✅ Online agora (recalcula a cada 1s por causa do tick) */
  const onlineStores = useMemo(() => {
    const now = Date.now();
    return sessions.filter((s: any) => getAliveMs(s) > now - ONLINE_WINDOW_MS)
      .length;
  }, [sessions, tick]);

  /** ✅ Tocando agora (recalcula a cada 1s por causa do tick) */
  const playingStores = useMemo(() => {
    const now = Date.now();
    return sessions.filter((s: any) => {
      const alive = getAliveMs(s) > now - ONLINE_WINDOW_MS;
      return alive && s.is_playing === true;
    }).length;
  }, [sessions, tick]);

  const getSessionForStore = (storeId: string) =>
    sessions.find((s: any) => s.store_id === storeId);

  const period =
    new Date().getHours() < 12
      ? "Manhã"
      : new Date().getHours() < 18
      ? "Tarde"
      : "Noite";

  /** ✅ Loading */
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral do sistema de rádio
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Clock className="w-4 h-4" />
            <span>{period}</span>

            <StatusBadge status="live" label={`${playingStores} tocando`} />
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <StatsCard
            title="Total de Lojas"
            value={stores.length}
            subtitle={`${
              stores.filter((s) => s.status === "active").length
            } ativas`}
            icon={Store}
          />

          <StatsCard
            title="Players Online"
            value={onlineStores}
            subtitle={`de ${stores.length} lojas`}
            icon={Activity}
          />

          <StatsCard
            title="Avisos Ativos"
            value={announcements.length}
            subtitle="Programados"
            icon={Megaphone}
          />

          <StatsCard
            title="Volume Médio"
            value={`${Math.round(
              stores.reduce((acc, s) => acc + (s.default_volume || 0), 0) /
                (stores.length || 1)
            )}%`}
            subtitle="Em todas as lojas"
            icon={Volume2}
          />
        </div>

        {/* Lojas */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Lojas</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stores.map((store) => (
              <StoreCard
                key={store.id}
                store={store}
                session={getSessionForStore(store.id)}
                onViewPlayer={() => navigate(`/player?store=${store.id}`)}
                onEdit={() => navigate("/stores")}
              />
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
