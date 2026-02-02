import { useEffect, useMemo, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

type TrackRow = {
  id: string;
  title: string;
  artist: string | null;
  file_url: string;
};

type PlaylistTrackRow = {
  id: string;
  playlist_id: string;
  track_id: string;
  position: number;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  playlistId: string | null;
  onChanged?: () => void;
}

export function PlaylistTracksDialog({ open, onOpenChange, playlistId, onChanged }: Props) {
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);

  const [tracks, setTracks] = useState<TrackRow[]>([]);
  const [links, setLinks] = useState<PlaylistTrackRow[]>([]);

  // ✅ garante que o botão abre a janela de arquivos
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open && playlistId) {
      fetchAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, playlistId]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const tracksRes: any = await (supabase as any)
        .from('tracks')
        .select('id,title,artist,file_url')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (tracksRes.error) throw tracksRes.error;

      const linksRes: any = await (supabase as any)
        .from('playlist_tracks')
        .select('id,playlist_id,track_id,position')
        .eq('playlist_id', playlistId);

      if (linksRes.error) throw linksRes.error;

      setTracks(tracksRes.data || []);
      setLinks(linksRes.data || []);
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao carregar músicas');
    } finally {
      setLoading(false);
    }
  };

  const linkedSet = useMemo(() => new Set(links.map(l => l.track_id)), [links]);

  const filteredTracks = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tracks;
    return tracks.filter(t =>
      (t.title || '').toLowerCase().includes(q) ||
      (t.artist || '').toLowerCase().includes(q)
    );
  }, [tracks, search]);

  const addTrack = async (trackId: string) => {
    if (!playlistId) return;

    if (linkedSet.has(trackId)) {
      toast.message('Essa música já está na playlist');
      return;
    }

    setSavingId(trackId);
    try {
      // posição = maior posição + 1
      const maxPos = links.reduce((m, l) => Math.max(m, l.position || 0), 0);

      const ins: any = await (supabase as any)
        .from('playlist_tracks')
        .insert({
          playlist_id: playlistId,
          track_id: trackId,
          position: maxPos + 1,
        });

      if (ins.error) throw ins.error;

      toast.success('Música adicionada!');
      await fetchAll();
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao adicionar');
    } finally {
      setSavingId(null);
    }
  };

  const removeTrack = async (trackId: string) => {
    if (!playlistId) return;

    setSavingId(trackId);
    try {
      const del: any = await (supabase as any)
        .from('playlist_tracks')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('track_id', trackId);

      if (del.error) throw del.error;

      toast.success('Removida da playlist');
      await fetchAll();
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.message || 'Erro ao remover');
    } finally {
      setSavingId(null);
    }
  };

  // ✅ upload no bucket "tracks" + cria registro em "tracks" + adiciona na playlist
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!playlistId) {
        toast.error('Selecione uma playlist primeiro');
        return;
      }

      const files = e.target.files;
      if (!files || files.length === 0) return;

      setUploading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      console.log('SESSION:', sessionData.session);

      // ✅ necessário por causa da policy: uploaded_by = auth.uid()
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      const userId = userData?.user?.id;
      if (!userId) throw new Error('Usuário não autenticado');

      for (const file of Array.from(files)) {
        if (!file.type.startsWith('audio/')) {
          toast.error(`Arquivo não é áudio: ${file.name}`);
          continue;
        }

        const safeName = file.name.replace(/[^\w.\-]+/g, '_');
        const filePath = `playlist/${playlistId}/${Date.now()}-${safeName}`;

        // 1) upload no Storage (bucket tracks é public)
        const up: any = await (supabase as any).storage
          .from('tracks')
          .upload(filePath, file, { upsert: false });

        if (up.error) throw up.error;

        // 2) url pública
        const pub = (supabase as any).storage.from('tracks').getPublicUrl(filePath);
        const publicUrl = pub?.data?.publicUrl;
        if (!publicUrl) throw new Error('Não foi possível gerar URL pública do arquivo');

        // 3) inserir na tabela tracks (com uploaded_by)
        const title = file.name.replace(/\.[^/.]+$/, '');
        const insTrack: any = await (supabase as any)
          .from('tracks')
          .insert({
            title,
            artist: null,
            file_url: publicUrl,
            is_active: true,
            uploaded_by: userId,
          })
          .select('id')
          .single();

        if (insTrack.error) throw insTrack.error;

        const newTrackId = insTrack?.data?.id as string | undefined;
        if (!newTrackId) throw new Error('Falha ao obter ID da música criada');

        // 4) vincula na playlist usando a lógica existente (position etc.)
        await addTrack(newTrackId);
      }

      toast.success('Upload concluído!');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Erro no upload');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* ✅ trava largura do modal (não estoura) */}
      <DialogContent className="glass-card border-border w-[min(42rem,95vw)] max-w-[95vw] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Músicas da Playlist</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-10 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              placeholder="Buscar música..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* ✅ botão upload garantido (abre janela do PC) */}
            <div className="flex items-center justify-between gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                multiple
                onChange={handleUpload}
                style={{ display: 'none' }}
                disabled={uploading || !playlistId}
              />

              <Button
                type="button"
                disabled={uploading || !playlistId}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? 'Enviando...' : '+ Upload de músicas'}
              </Button>

              <div className="text-xs text-muted-foreground">
                Envia para o Storage e já adiciona na playlist
              </div>
            </div>

            {/* ✅ só scroll vertical; sem scroll lateral */}
            <div className="max-h-[420px] overflow-y-auto overflow-x-hidden rounded-xl border border-border">
              {filteredTracks.map((t) => {
                const linked = linkedSet.has(t.id);

                return (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 p-3 border-b border-border last:border-b-0 w-full min-w-0"
                  >
                    {/* ✅ texto ocupa espaço e corta com ... sem empurrar botão */}
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <div className="font-medium truncate" title={t.title}>
                        {t.title}
                      </div>
                      <div className="text-sm text-muted-foreground truncate" title={t.artist || '—'}>
                        {t.artist || '—'}
                      </div>
                    </div>

                    {/* ✅ botão fixo */}
                    {linked ? (
                      <Button
                        variant="ghost"
                        className="shrink-0"
                        disabled={savingId === t.id}
                        onClick={() => removeTrack(t.id)}
                      >
                        Remover
                      </Button>
                    ) : (
                      <Button
                        className="shrink-0"
                        disabled={savingId === t.id}
                        onClick={() => addTrack(t.id)}
                      >
                        Adicionar
                      </Button>
                    )}
                  </div>
                );
              })}

              {filteredTracks.length === 0 && (
                <div className="p-8 text-center text-muted-foreground">Nenhuma música encontrada.</div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
