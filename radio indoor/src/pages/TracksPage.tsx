import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Music2, Trash2, Play, Pause, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';


type TrackRow = {
  id: string;
  title: string;
  artist: string | null;
  file_url: string;
  duration_seconds: number | null;
  is_active: boolean | null;
  created_at: string | null;
};

export default function TracksPage() {
  const { user, loading: authLoading, isAdmin, isManager } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [tracks, setTracks] = useState<TrackRow[]>([]);
  const [search, setSearch] = useState('');

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audio] = useState(() => new Audio());

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (user) fetchTracks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [audio]);

  const fetchTracks = async () => {
    setLoading(true);
    try {
      const res: any = await (supabase as any)
        .from('tracks')
        .select('*')
        .order('created_at', { ascending: false });

      if (res.error) throw res.error;
      setTracks(res.data || []);
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao carregar músicas');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter(t =>
      (t.title || '').toLowerCase().includes(q) ||
      (t.artist || '').toLowerCase().includes(q)
    );
  }, [tracks, search]);

  const onPickFile = (f: File | null) => {
    if (!f) return setFile(null);

    const isMp3 = f.type === 'audio/mpeg' || f.name.toLowerCase().endsWith('.mp3');
    if (!isMp3) {
      toast.error('Envie um arquivo MP3');
      return;
    }
    if (f.size > 25 * 1024 * 1024) {
      toast.error('Arquivo muito grande (máx 25MB por enquanto)');
      return;
    }
    setFile(f);

    // Preenche título automático se estiver vazio
    if (!title.trim()) {
      const clean = f.name.replace(/\.mp3$/i, '');
      setTitle(clean);
    }
  };

  const uploadTrack = async () => {
    if (!user) return;

    // Regras de permissão (ajuste se quiser)
    if (!(isAdmin || isManager)) {
      toast.error('Você não tem permissão para enviar músicas');
      return;
    }

    if (!file) {
      toast.error('Selecione um MP3');
      return;
    }
    if (!title.trim()) {
      toast.error('Informe o nome da música');
      return;
    }

    setUploading(true);
    try {
      // 1) Upload no Storage (bucket tracks)
      const ext = file.name.split('.').pop() || 'mp3';
      const safeName = file.name.replace(/[^\w.\-]+/g, '_');
      const path = `${user.id}/${Date.now()}_${safeName}`;

      const up: any = await (supabase as any)
        .storage
        .from('tracks')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'audio/mpeg',
        });

      if (up.error) throw up.error;

      // 2) Pegar URL pública (aqui o bucket é privado, então usamos signed URL depois no player)
      // Para salvar no banco, salvamos o PATH do storage (recomendado)
      const fileUrlToStore = path;

      // 3) Salvar no banco
      const ins: any = await (supabase as any)
        .from('tracks')
        .insert({
          title: title.trim(),
          artist: artist.trim() || null,
          file_url: fileUrlToStore,
          uploaded_by: user.id,
          is_active: true,
        });

      if (ins.error) throw ins.error;

      toast.success('Música enviada!');
      setTitle('');
      setArtist('');
      setFile(null);

      await fetchTracks();
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao enviar música');
    } finally {
      setUploading(false);
    }
  };

  const playPreview = async (t: TrackRow) => {
    try {
      if (playingId === t.id) {
        audio.pause();
        setPlayingId(null);
        return;
      }

      // Como o bucket é privado, geramos URL assinada para tocar
      const signed: any = await (supabase as any)
        .storage
        .from('tracks')
        .createSignedUrl(t.file_url, 60); // 60s

      if (signed.error) throw signed.error;

      audio.pause();
      audio.src = signed.data.signedUrl;
      await audio.play();
      setPlayingId(t.id);

      audio.onended = () => setPlayingId(null);
    } catch (e: any) {
      toast.error(e?.message || 'Não foi possível tocar o preview');
    }
  };

  const deleteTrack = async (t: TrackRow) => {
    if (!user) return;

    if (!(isAdmin || isManager)) {
      toast.error('Você não tem permissão para excluir músicas');
      return;
    }

    if (!confirm(`Excluir "${t.title}"?`)) return;

    try {
      // 1) Apaga do storage
      const rm: any = await (supabase as any).storage.from('tracks').remove([t.file_url]);
      if (rm.error) throw rm.error;

      // 2) Apaga do banco
      const del: any = await (supabase as any).from('tracks').delete().eq('id', t.id);
      if (del.error) throw del.error;

      toast.success('Música excluída');
      await fetchTracks();
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao excluir');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Biblioteca</h1>
            <p className="text-muted-foreground">Envie músicas MP3 e gerencie o acervo</p>
          </div>
        </div>

        {/* Upload */}
        <div className="glass-card border border-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Music2 className="w-5 h-5 text-muted-foreground" />
            <h2 className="font-semibold">Enviar nova música</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input placeholder="Título (obrigatório)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="Artista (opcional)" value={artist} onChange={(e) => setArtist(e.target.value)} />
            <Input
              type="file"
              accept=".mp3,audio/mpeg"
              onChange={(e) => onPickFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={uploadTrack} disabled={uploading}>
              {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Enviar MP3
            </Button>

            {file && (
              <p className="text-sm text-muted-foreground">
                Selecionado: <span className="font-medium text-foreground">{file.name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Busca */}
        <div className="relative max-w-md">
          <Input placeholder="Buscar por título ou artista..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        {/* Lista */}
        <div className="glass-card border border-border rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-border font-semibold">Músicas ({filtered.length})</div>

          <div className="divide-y divide-border">
            {filtered.map((t) => (
              <div key={t.id} className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{t.title}</div>
                  <div className="text-sm text-muted-foreground truncate">{t.artist || '—'}</div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => playPreview(t)}>
                    {playingId === t.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>

                  <Button variant="ghost" size="icon" onClick={() => deleteTrack(t)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">Nenhuma música encontrada.</div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
