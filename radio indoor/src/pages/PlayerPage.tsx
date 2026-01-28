import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Play, Pause, SkipForward, SkipBack, Radio, Music, Megaphone, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VolumeControl } from '@/components/ui/VolumeControl';
import { AudioVisualizer } from '@/components/ui/AudioVisualizer';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { Store, Track, Announcement } from '@/lib/supabase-types';

const BUCKET_NAME = 'tracks';

/** =========================
 *  Helpers URL (Storage)
 *  ========================= */
const getPublicAudioUrl = (pathOrUrl?: string | null) => {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) return pathOrUrl;
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(pathOrUrl);
  return data?.publicUrl || '';
};

/** =========================
 *  Schedules helpers
 *  ========================= */
const parseFrequencyMinutes = (freq?: string | null) => {
  if (!freq) return 0;
  const f = String(freq).trim().toLowerCase();
  if (f.endsWith('min')) return parseInt(f.replace('min', ''), 10) || 0;
  if (f.endsWith('h')) return (parseInt(f.replace('h', ''), 10) || 0) * 60;
  const n = parseInt(f, 10);
  return Number.isFinite(n) ? n : 0;
};

const isWithinTimeWindow = (now: Date, start?: string | null, end?: string | null) => {
  if (!start || !end) return true;

  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);

  const cur = now.getHours() * 60 + now.getMinutes();
  const s = (sh || 0) * 60 + (sm || 0);
  const e = (eh || 0) * 60 + (em || 0);

  if (s <= e) return cur >= s && cur <= e;
  return cur >= s || cur <= e;
};

/** =========================
 *  Persistência local
 *  ========================= */
const LS_KEY = 'agape_player_state_v1';

type SavedPlayerState = {
  storeId?: string | null;
  trackId?: string | null;
  time?: number;
  volume?: number;
  updatedAt?: number;
  shouldBePlaying?: boolean;
};

const savePlayerState = (state: SavedPlayerState) => {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ ...state, updatedAt: Date.now() }));
  } catch {}
};

const readPlayerState = (): SavedPlayerState | null => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

type ScheduleRow = {
  id: string;
  announcement_id: string;
  store_id: string | null;
  is_active: boolean;
  frequency: string | null;
  days_of_week: any[] | null;
  start_time: string | null;
  end_time: string | null;
  last_played_at: string | null;
};

export default function PlayerPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('store');

  const audioRef = useRef<HTMLAudioElement>(null);
  const announcementRef = useRef<HTMLAudioElement>(null);
  const isAnnouncementPlayingRef = useRef(false);
  const resumeWithFadeRef = useRef(false);

  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const resumeLockRef = useRef(false);
  const lastWakeAtRef = useRef(0);

  const resumeAttemptsRef = useRef(0);
  const resumeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ✅ evita recarregar loja e resetar volume/tempo sem necessidade
  const storeLoadedRef = useRef(false);

  const [store, setStore] = useState<Store | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [shouldBePlaying, setShouldBePlaying] = useState(false);
  const [isConnected] = useState(true);

  const [volume, setVolume] = useState(70);
  const [loadingPage, setLoadingPage] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [playedTracks, setPlayedTracks] = useState<Set<string>>(new Set());
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);

  /** ✅ salvar estado AGORA (antes de sair da página/rota) */
  const saveNow = useCallback(() => {
    const el = audioRef.current;

    savePlayerState({
      storeId,
      trackId: currentTrack?.id || null,
      time: el?.currentTime ?? currentTime ?? 0,
      volume,
      shouldBePlaying,
    });
  }, [storeId, currentTrack?.id, currentTime, volume, shouldBePlaying]);

  /** ✅ quando storeId muda, “desmarca” loja carregada */
  useEffect(() => {
    storeLoadedRef.current = false;
  }, [storeId]);

  /** ✅ restaura estado quando abrir /player?store=... */
  useEffect(() => {
    if (!storeId) return;

    const saved = readPlayerState();
    if (saved?.storeId !== storeId) return;

    if (typeof saved.shouldBePlaying === 'boolean') setShouldBePlaying(saved.shouldBePlaying);
    if (typeof saved.volume === 'number' && Number.isFinite(saved.volume)) setVolume(saved.volume);

    // o tempo e a track serão restaurados quando tracks carregarem + loadedmetadata
  }, [storeId]);

  /** ✅ salva quando sair / trocar de rota / fechar aba */
  useEffect(() => {
    const onPageHide = () => saveNow();
    const onBeforeUnload = () => saveNow();

    window.addEventListener('pagehide', onPageHide);
    window.addEventListener('beforeunload', onBeforeUnload);

    return () => {
      window.removeEventListener('pagehide', onPageHide);
      window.removeEventListener('beforeunload', onBeforeUnload);
      saveNow(); // salva também no unmount
    };
  }, [saveNow]);

  /** cleanup retry */
  useEffect(() => {
    return () => {
      if (resumeIntervalRef.current) clearInterval(resumeIntervalRef.current);
    };
  }, []);

  /** 1) Dados gerais (lista lojas + anúncios) */
  const fetchData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [storesRes, announcementsRes] = await Promise.all([
        supabase.from('stores').select('*').eq('status', 'active').order('name'),
        supabase.from('announcements').select('*').eq('is_active', true),
      ]);

      if (storesRes.data) setStores(storesRes.data as unknown as Store[]);
      if (announcementsRes.data) setAnnouncements(announcementsRes.data as unknown as Announcement[]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoadingData(false);
    }
  }, []);

  /** ✅ Buscar schedules (globais + da loja) */
  const fetchSchedules = useCallback(async () => {
    if (!storeId) return;

    const { data, error } = await (supabase as any)
      .from('announcement_schedules')
      .select('*')
      .eq('is_active', true)
      .or(`store_id.is.null,store_id.eq.${storeId}`);

    if (error) {
      console.error('Erro ao buscar schedules:', error);
      return;
    }

    setSchedules((data || []) as ScheduleRow[]);
  }, [storeId]);

  /** ✅ refresca schedules */
  useEffect(() => {
    if (!authLoading && user && storeId) {
      fetchSchedules();
      const iv = setInterval(fetchSchedules, 30000);
      return () => clearInterval(iv);
    }
  }, [authLoading, user, storeId, fetchSchedules]);

  /** 2) Carregar loja + playlist ativa + tracks */
  const loadStoreAndPlaylist = useCallback(async () => {
    if (!storeId) return;

    // ✅ só mostra loading “primeira vez”
    setLoadingPage((prev) => (storeLoadedRef.current ? prev : true));

    try {
      const storeRes: any = await (supabase as any)
        .from('stores')
        .select('id,name,code,status,default_volume,active_playlist_id')
        .eq('id', storeId)
        .maybeSingle();

      if (storeRes.error) throw storeRes.error;

      if (!storeRes.data) {
        toast.error('Loja não encontrada');
        setStore(null);
        setTracks([]);
        setCurrentTrack(null);
        return;
      }

      const loadedStore = storeRes.data as unknown as Store;
      setStore(loadedStore);
      storeLoadedRef.current = true;

      // ✅ NÃO sobrescreve volume salvo
      const saved = readPlayerState();
      const savedVolume =
        saved?.storeId === storeId && typeof saved.volume === 'number' && Number.isFinite(saved.volume)
          ? saved.volume
          : null;

      setVolume(savedVolume ?? loadedStore.default_volume ?? 70);

      const playlistId = (storeRes.data.active_playlist_id as string | null) ?? null;
      if (!playlistId) {
        setTracks([]);
        setCurrentTrack(null);
        toast.error('Esta loja não tem playlist ativa');
        return;
      }

      const linksRes: any = await (supabase as any)
        .from('playlist_tracks')
        .select('track_id, tracks(*)')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: true });

      if (linksRes.error) throw linksRes.error;

      const loadedTracks: Track[] = (linksRes.data || []).map((row: any) => row.tracks).filter(Boolean);
      setTracks(loadedTracks);

      if (loadedTracks.length > 0) {
        const saved2 = readPlayerState();
        const savedTrackId = saved2?.storeId === storeId ? saved2?.trackId || null : null;
        const found = savedTrackId ? loadedTracks.find((t) => t.id === savedTrackId) : null;

        setCurrentTrack((prev) => {
          if (!prev) return found || loadedTracks[0];
          const stillExists = loadedTracks.some((t) => t.id === prev.id);
          return stillExists ? prev : found || loadedTracks[0];
        });
      } else {
        setCurrentTrack(null);
        toast.error('A playlist ativa não tem músicas');
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao carregar player');
    } finally {
      setLoadingPage(false);
    }
  }, [storeId]);

  /** 3) Se não tiver logado, manda pro login */
  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  /** 4) Ao logar, carrega dados gerais */
  useEffect(() => {
    if (!authLoading && user) fetchData();
  }, [authLoading, user, fetchData]);

  /** 5) Quando tiver storeId, carrega loja + playlist + tracks */
  useEffect(() => {
    if (!authLoading && user && storeId) {
      loadStoreAndPlaylist();
    } else if (!storeId) {
      setStore(null);
      setTracks([]);
      setCurrentTrack(null);
      setLoadingPage(false);
    }
  }, [authLoading, user, storeId, loadStoreAndPlaylist]);

  /** 6) Quando currentTrack muda, seta src só se mudou + restaura tempo salvo */
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    if (!currentTrack?.file_url) return;

    const url = getPublicAudioUrl(currentTrack.file_url);
    if (!url) return;

    if (el.src !== url) {
      el.src = url;
      el.load();
    }

    const onLoadedMeta = () => {
      const saved = readPlayerState();
      if (saved?.storeId === storeId && saved?.trackId === currentTrack.id && typeof saved.time === 'number') {
        const dur = el.duration || saved.time;
        const safeTime = Math.max(0, Math.min(saved.time, dur));
        if (Number.isFinite(safeTime)) {
          try {
            el.currentTime = safeTime;
          } catch {}
        }
      }

      const autoplayOk = localStorage.getItem('autoplay_ok') === '1';
      if (autoplayOk && shouldBePlaying) {
        el.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    };

    el.addEventListener('loadedmetadata', onLoadedMeta);
    return () => {
      el.removeEventListener('loadedmetadata', onLoadedMeta);
    };
  }, [currentTrack, storeId, shouldBePlaying]);

  /** 7) Heartbeat */
  const updateSession = useCallback(async () => {
    if (!store) return;

    const sessionData = {
      store_id: store.id,
      status: isPlaying ? 'playing' : 'stopped',
      last_seen_at: new Date().toISOString(),
      is_playing: isPlaying,
      current_volume: volume,
      current_track_id: currentTrack?.id || null,
    };

    const { error } = await supabase.from('player_sessions').upsert(sessionData, { onConflict: 'store_id' });
    if (error) console.log('updateSession error:', error);
  }, [store, isPlaying, volume, currentTrack]);

  useEffect(() => {
    if (store) {
      updateSession();
      heartbeatRef.current = setInterval(updateSession, 30000);
    }
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [store, updateSession]);

  /** 8) Volume + salvar estado */
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume / 100;
    if (announcementRef.current) announcementRef.current.volume = volume / 100;

    savePlayerState({
      storeId,
      trackId: currentTrack?.id || null,
      time: audioRef.current?.currentTime || currentTime,
      volume,
      shouldBePlaying,
    });
  }, [volume, storeId, currentTrack?.id, shouldBePlaying, currentTime]);

  /** =========================
   *  ✅ Force resume (anti-loop) - sem resetar tempo
   *  ========================= */
  const forceResume = useCallback(async () => {
    if (isAnnouncementPlayingRef.current) return;

    const el = audioRef.current;
    if (!el || !currentTrack?.file_url) return;
    if (!shouldBePlaying) return;

    if (resumeLockRef.current) return;
    resumeLockRef.current = true;

    try {
      const finalUrl = getPublicAudioUrl(currentTrack.file_url);
      if (!finalUrl) return;

      // só troca src se necessário
      if (el.src !== finalUrl) {
        el.src = finalUrl;
        el.load();
      }

      // ✅ NÃO dar load() se já é a mesma música (load reseta pro início)
      const now = Date.now();
      if (el.readyState < 2 && el.src !== finalUrl && now - lastWakeAtRef.current > 2000) {
        lastWakeAtRef.current = now;
        try {
          el.load();
        } catch {}
      }

      await el.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    } finally {
      resumeLockRef.current = false;
    }
  }, [currentTrack?.file_url, shouldBePlaying]);

  /** ✅ Auto-resume com retry */
  const startAutoResume = useCallback(() => {
    if (isAnnouncementPlayingRef.current) return;
    if (!shouldBePlaying) return;

    if (resumeIntervalRef.current) {
      clearInterval(resumeIntervalRef.current);
      resumeIntervalRef.current = null;
    }

    resumeAttemptsRef.current = 0;

    resumeIntervalRef.current = setInterval(() => {
      const el = audioRef.current;
      if (!el) return;

      if (!shouldBePlaying) {
        clearInterval(resumeIntervalRef.current!);
        resumeIntervalRef.current = null;
        return;
      }

      const playing = !el.paused && !el.ended;
      if (playing) {
        clearInterval(resumeIntervalRef.current!);
        resumeIntervalRef.current = null;
        setIsPlaying(true);
        return;
      }

      resumeAttemptsRef.current += 1;
      forceResume();

      if (resumeAttemptsRef.current >= 6) {
        clearInterval(resumeIntervalRef.current!);
        resumeIntervalRef.current = null;
      }
    }, 1000);
  }, [forceResume, shouldBePlaying]);

  /** Random sem repetir */
  const getNextTrack = useCallback(() => {
    if (tracks.length === 0) return null;

    if (playedTracks.size >= tracks.length) setPlayedTracks(new Set());

    const unplayed = tracks.filter((t) => !playedTracks.has(t.id));
    if (unplayed.length === 0) return tracks[Math.floor(Math.random() * tracks.length)];
    return unplayed[Math.floor(Math.random() * unplayed.length)];
  }, [tracks, playedTracks]);

  const playTrack = useCallback(
    (track: Track) => {
      setShouldBePlaying(true);
      setCurrentTrack(track);
      setPlayedTracks((prev) => new Set(prev).add(track.id));

      const el = audioRef.current;
      if (!el) return;

      const url = getPublicAudioUrl(track.file_url);
      if (!url) {
        toast.error('URL do áudio vazia. Verifique o file_url no banco.');
        return;
      }

      if (el.src !== url) {
        el.src = url;
        el.load();
      }

      el.play()
        .then(() => {
          setIsPlaying(true);
          localStorage.setItem('autoplay_ok', '1');
          savePlayerState({ storeId, trackId: track.id, time: 0, volume, shouldBePlaying: true });
        })
        .catch((err) => {
          console.error('Erro ao tocar:', err);
          setIsPlaying(false);
          toast.error('Não foi possível tocar o áudio.');
        });
    },
    [storeId, volume]
  );

  const playNextTrack = useCallback(() => {
    const next = getNextTrack();
    if (next) playTrack(next);
  }, [getNextTrack, playTrack]);

  const handlePlay = () => {
    setShouldBePlaying(true);

    if (!currentTrack && tracks.length > 0) {
      playNextTrack();
      return;
    }

    const el = audioRef.current;
    if (!el || !currentTrack?.file_url) return;

    const finalUrl = getPublicAudioUrl(currentTrack.file_url);
    if (!finalUrl) return;

    if (el.src !== finalUrl) {
      el.src = finalUrl;
      el.load();
    }

    el.play()
      .then(() => {
        setIsPlaying(true);
        localStorage.setItem('autoplay_ok', '1');
        savePlayerState({
          storeId,
          trackId: currentTrack.id,
          time: el.currentTime || 0,
          volume,
          shouldBePlaying: true,
        });
      })
      .catch((err) => {
        console.error(err);
        setIsPlaying(false);
        toast.error('Não foi possível iniciar o áudio.');
      });
  };

  const handlePause = () => {
    setShouldBePlaying(false);

    const el = audioRef.current;
    if (el) {
      el.pause();
      setIsPlaying(false);
    }

    savePlayerState({
      storeId,
      trackId: currentTrack?.id || null,
      time: audioRef.current?.currentTime || 0,
      volume,
      shouldBePlaying: false,
    });

    if (resumeIntervalRef.current) {
      clearInterval(resumeIntervalRef.current);
      resumeIntervalRef.current = null;
    }
  };

  const handleTrackEnd = () => playNextTrack();

  const handleTimeUpdate = () => {
    const el = audioRef.current;
    if (!el) return;

    const t = el.currentTime || 0;
    setCurrentTime(t);
    setDuration(el.duration || 0);

    savePlayerState({ storeId, trackId: currentTrack?.id || null, time: t, volume, shouldBePlaying });
  };

  const handleAnnouncementEnd = () => {
    resumeWithFadeRef.current = true;

    isAnnouncementPlayingRef.current = false;
    setCurrentAnnouncement(null);

    if (!shouldBePlaying) {
      setIsPlaying(false);
      return;
    }

    // ✅ volta a música tentando do ponto onde parou
    startAutoResume();
  };

  const playAnnouncement = useCallback(
    (a: Announcement) => {
      isAnnouncementPlayingRef.current = true;

      if (resumeIntervalRef.current) {
        clearInterval(resumeIntervalRef.current);
        resumeIntervalRef.current = null;
      }

      // ✅ salva o ponto exato antes de pausar
      const el = audioRef.current;
      if (el) {
        savePlayerState({
          storeId,
          trackId: currentTrack?.id || null,
          time: el.currentTime || 0,
          volume,
          shouldBePlaying,
        });
        el.pause();
      }

      setIsPlaying(false);
      setCurrentAnnouncement(a);

      const an = announcementRef.current;
      if (!an) return;

      const url = getPublicAudioUrl(a.file_url);
      if (!url) {
        toast.error('URL do aviso vazia. Verifique o file_url do anúncio.');
        return;
      }

      an.src = url;
      an.load();
      an.play().catch((err) => {
        console.error('Erro ao tocar aviso:', err);
        toast.error('Não foi possível tocar o aviso.');
      });
    },
    [storeId, currentTrack?.id, volume, shouldBePlaying]
  );

  /** ✅ MOTOR: toca automaticamente conforme schedules */
  useEffect(() => {
    if (!storeId) return;
    if (!schedules.length) return;

    const tick = async () => {
      if (currentAnnouncement || isAnnouncementPlayingRef.current) return;

      const now = new Date();
      const day = now.getDay();

      const due = schedules.find((sch) => {
        const freqMin = parseFrequencyMinutes(sch.frequency);
        if (!freqMin) return false;

        const days = (sch.days_of_week || [])
          .map((d: any) => Number(d))
          .filter((n: number) => Number.isFinite(n));

        if (days.length && !days.includes(day)) return false;
        if (!isWithinTimeWindow(now, sch.start_time, sch.end_time)) return false;

        const last = sch.last_played_at ? new Date(sch.last_played_at).getTime() : 0;
        const diffMin = (Date.now() - last) / 60000;
        return !last || diffMin >= freqMin;
      });

      if (!due) return;

      const announcement = announcements.find((a) => a.id === due.announcement_id);
      if (!announcement) return;

      playAnnouncement(announcement);

      const nowIso = new Date().toISOString();
      await (supabase as any).from('announcement_schedules').update({ last_played_at: nowIso }).eq('id', due.id);

      setSchedules((prev) => prev.map((s) => (s.id === due.id ? { ...s, last_played_at: nowIso } : s)));
    };

    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [storeId, schedules, announcements, currentAnnouncement, playAnnouncement]);

  const handleStoreSelect = (selectedStore: Store) => {
    navigate(`/player?store=${selectedStore.id}`, { replace: true });
  };

  const formatTime = (seconds: number) => {
    if (!seconds || Number.isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentHour = new Date().getHours();
  const period = currentHour < 12 ? 'Manhã' : currentHour < 18 ? 'Tarde' : 'Noite';

  if (authLoading || loadingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Carregando player...</p>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mx-auto mb-6">
              <Radio className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">ÁgapePlay Player</h1>
            <p className="text-muted-foreground">Selecione uma loja para iniciar</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stores.map((s) => (
              <button
                key={s.id}
                onClick={() => handleStoreSelect(s)}
                className={cn(
                  'glass-card p-6 rounded-xl border text-left transition-all duration-300',
                  'hover:border-primary/50 hover:shadow-lg hover:scale-[1.02]'
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Radio className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{s.name}</h3>
                    <p className="text-sm text-muted-foreground">Código: {s.code}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {stores.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhuma loja disponível</p>
            </div>
          )}

          <div className="text-center">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              ← Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <audio
        ref={audioRef}
        onEnded={handleTrackEnd}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPlaying={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => console.log('AUDIO: waiting')}
        onSuspend={() => console.log('AUDIO: suspend')}
        onStalled={() => console.log('AUDIO: stalled')}
        onError={() => {
          console.log('AUDIO: error', audioRef.current?.error);
          setIsPlaying(false);
        }}
      />

      <audio ref={announcementRef} onEnded={handleAnnouncementEnd} />

      <header className="flex items-center justify-between p-6 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
            <Radio className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{store.name}</h1>
            <p className="text-sm text-muted-foreground">Código: {store.code}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <StatusBadge status={isConnected ? 'live' : 'offline'} label={isConnected ? 'Conectado' : 'Desconectado'} />
          <span className="text-sm text-muted-foreground">{period}</span>
          <Button variant="ghost" size="icon" onClick={fetchData} disabled={loadingData}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8">
        {currentAnnouncement && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/95 z-50 animate-fade-in">
            <div className="text-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-warning/20 flex items-center justify-center mx-auto animate-pulse">
                <Megaphone className="w-12 h-12 text-warning" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">{currentAnnouncement.title}</h2>
                <p className="text-muted-foreground">Reproduzindo aviso...</p>
              </div>
              <AudioVisualizer isPlaying={true} bars={12} />
            </div>
          </div>
        )}

        <div className="relative mb-8">
          <div
            className={cn(
              'w-64 h-64 md:w-80 md:h-80 rounded-2xl flex items-center justify-center',
              'bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5',
              'border border-border shadow-2xl',
              isPlaying && 'animate-pulse-slow'
            )}
          >
            <Music className="w-24 h-24 text-primary/50" />
          </div>

          {isPlaying && (
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2">
              <AudioVisualizer isPlaying={isPlaying} bars={8} />
            </div>
          )}
        </div>

        <div className="text-center mb-8 max-w-md">
          {currentTrack ? (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-2 line-clamp-1">{currentTrack.title}</h2>
              <p className="text-lg text-muted-foreground">{currentTrack.artist || 'Artista Desconhecido'}</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-2">ÁgapePlay</h2>
              <p className="text-lg text-muted-foreground">Pressione play para iniciar</p>
            </>
          )}
        </div>

        {currentTrack && (
          <div className="w-full max-w-md mb-6">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-200" style={{ width: `${(currentTime / duration) * 100 || 0}%` }} />
            </div>
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        )}

        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            className="w-14 h-14"
            onClick={() => {
              if (audioRef.current) audioRef.current.currentTime = 0;
            }}
          >
            <SkipBack className="w-6 h-6" />
          </Button>

          <Button size="icon" className="w-20 h-20 rounded-full glow-primary" onClick={isPlaying ? handlePause : handlePlay}>
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </Button>

          <Button variant="ghost" size="icon" className="w-14 h-14" onClick={playNextTrack}>
            <SkipForward className="w-6 h-6" />
          </Button>
        </div>
      </main>

      <footer className="p-6 border-t border-border">
        <div className="max-w-md mx-auto space-y-4">
          <VolumeControl volume={volume} onChange={setVolume} />

          {announcements.length > 0 && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-3">Avisos Rápidos:</p>
              <div className="flex flex-wrap gap-2">
                {announcements.slice(0, 3).map((a) => (
                  <Button key={a.id} variant="outline" size="sm" onClick={() => playAnnouncement(a)} className="text-xs">
                    <Megaphone className="w-3 h-3 mr-1" />
                    {a.title}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
