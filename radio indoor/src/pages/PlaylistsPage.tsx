import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Music, MoreVertical, Trash2, Edit2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Playlist, Store, DayPeriod } from '@/lib/supabase-types';
import { getPeriodLabel } from '@/lib/supabase-types';
import { cn } from '@/lib/utils';
import { PlaylistTracksDialog } from '@/components/playlists/PlaylistTracksDialog';



const playlistSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  is_global: z.boolean(),
  store_id: z.string().optional(),
  period: z.enum(['morning', 'afternoon', 'night']).optional(),
  is_active: z.boolean(),
  scope: z.enum(['store', 'all_assigned', 'selected_stores']).default('store'),
  store_ids: z.array(z.string()).optional(),


});

type PlaylistFormData = z.infer<typeof playlistSchema>;

export default function PlaylistsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<Playlist | null>(null);
  const [tracksOpen, setTracksOpen] = useState(false);
  const [tracksPlaylistId, setTracksPlaylistId] = useState<string | null>(null);
  const [trackCountByPlaylist, setTrackCountByPlaylist] =
  useState<Record<string, number>>({});
  
  const form = useForm<PlaylistFormData>({
    resolver: zodResolver(playlistSchema),
    defaultValues: {
      name: '',
      description: '',
      is_global: false,
      is_active: true,
      scope: 'store',
      store_ids: [],


    },
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
  if (!authLoading && user) {
    fetchData();
    
  }
}, [authLoading, user, selectedStoreId]);


  useEffect(() => {
    if (editingPlaylist) {
      form.reset({
        name: editingPlaylist.name,
        description: editingPlaylist.description || '',
        is_global: editingPlaylist.is_global,
        store_id: editingPlaylist.store_id || undefined,
        period: editingPlaylist.period || undefined,
        is_active: editingPlaylist.is_active,
      });
    } else {
      form.reset({
        name: '',
        description: '',
        is_global: false,
        is_active: true,
      });
    }
  }, [editingPlaylist, form]);

  const fetchData = async () => {
  setLoading(true);
  try {
    const [playlistsRes, storesRes]: any = await Promise.all([
      (supabase as any).from('playlists').select('*').order('name'),
      (supabase as any).from('stores').select('*').eq('status', 'active').order('name'),
    ]);

    if (playlistsRes.error) throw playlistsRes.error;
    if (storesRes.error) throw storesRes.error;

    const playlistsData = playlistsRes.data || [];
    const storesData = storesRes.data || [];

    setStores(storesData);

    // Se você já usa uniqueById, mantém. Se não, pode usar direto playlistsData.
    const uniqueById = playlistsData.reduce((acc: any[], p: any) => {
      if (!acc.find(x => x.id === p.id)) acc.push(p);
      return acc;
    }, []);

    setPlaylists(uniqueById);

    // ✅ Contar músicas por playlist
    const linksRes: any = await (supabase as any)
      .from('playlist_tracks')
      .select('playlist_id');

    if (linksRes.error) throw linksRes.error;

    const counts: Record<string, number> = {};
    (linksRes.data || []).forEach((row: any) => {
      counts[row.playlist_id] = (counts[row.playlist_id] || 0) + 1;
    });

    setTrackCountByPlaylist(counts);
  } catch (error: any) {
    console.error('Error fetching data:', error);
    toast.error(error?.message || 'Erro ao carregar playlists');
  } finally {
    setLoading(false);
  }
};


  const handleSubmit = async (data: PlaylistFormData) => {
    try {
      // ✅ por enquanto: se is_global estiver marcado, store_id fica null.
// ✅ se NÃO estiver marcado, amarra na loja selecionada na tela (selectedStoreId).
if (!data.is_global && !selectedStoreId) {
  toast.error('Selecione uma loja');
  return;
}

const payload = {
  ...data,
  store_id: data.is_global ? null : selectedStoreId,
  period: data.period || null,
};


      if (editingPlaylist) {
        const { error } = await supabase
          .from('playlists')
          .update(payload)
          .eq('id', editingPlaylist.id);

        if (error) throw error;
        toast.success('Playlist atualizada!');
      } else {
        if (!user) {
  toast.error('Você precisa estar logado');
  return;
}

// Regras do modelo C
if (payload.scope === 'store' && !selectedStoreId) {
  toast.error('Selecione uma loja no topo da página');
  return;
}

if (payload.scope === 'selected_stores' && (!payload.store_ids || payload.store_ids.length === 0)) {
  toast.error('Selecione pelo menos 1 loja');
  return;
}

const storeIdToSave = payload.scope === 'store' ? selectedStoreId : null;

const { data: inserted, error: insertError } = await supabase
  .from('playlists')
  .insert({
    name: payload.name,
    description: payload.description,
    period: payload.period,
    is_active: payload.is_active,

    // modelo novo
    scope: payload.scope,
    created_by: user.id,
    store_id: storeIdToSave,

    // mantém compatível (você pode remover depois)
    is_global: payload.scope !== 'store',
  })
  .select('id')
  .single();

if (insertError) throw insertError;

// Se for lojas específicas, grava na tabela de ligação
if (payload.scope === 'selected_stores') {
  const rows = (payload.store_ids || []).map((sid: string) => ({
    playlist_id: inserted.id,
    store_id: sid,
  }));

  const { error: linkErr } = await (supabase as any).from('playlist_stores').insert(rows);

  if (linkErr) throw linkErr;
}

toast.success('Playlist criada!');

      }

      setDialogOpen(false);
      setEditingPlaylist(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar playlist');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta playlist?')) return;

    try {
      const { error } = await supabase.from('playlists').delete().eq('id', id);
      if (error) throw error;
      toast.success('Playlist excluída!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir playlist');
    }
  };
    const openTracks = (playlistId: string) => {
  setTracksPlaylistId(playlistId);
  setTimeout(() => setTracksOpen(true), 0);
};


  const filteredPlaylists = playlists.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const isGlobal = form.watch('is_global');

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Playlists</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as playlists de música
            </p>
          </div>
          <Button onClick={() => { setEditingPlaylist(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Playlist
          </Button>
        </div>
        <PlaylistTracksDialog
  open={tracksOpen}
  onOpenChange={(v) => {
    setTracksOpen(v);
    if (!v) setTracksPlaylistId(null);
  }}
  playlistId={tracksPlaylistId}
/>

{/* Loja selecionada */}
<div className="max-w-md mb-4">
<label className="text-sm font-medium">Loja</label>
 <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
    <SelectTrigger>
      <SelectValue placeholder="Selecione uma loja" />
    </SelectTrigger>

    <SelectContent>
      {stores.map((store) => (
        <SelectItem key={store.id} value={store.id}>
          {store.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          
          <Input
            placeholder="Buscar playlists..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaylists.map((playlist) => (
            <div
              key={playlist.id}
              className={cn(
                'glass-card rounded-xl border p-6 transition-all duration-300',
                'hover:shadow-lg hover:border-primary/20',
                !playlist.is_active && 'opacity-60'
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-3 rounded-lg',
                    playlist.is_global ? 'bg-accent/20' : 'bg-primary/20'
                  )}>
                    <Music className={cn(
                      'w-6 h-6',
                      playlist.is_global ? 'text-accent' : 'text-primary'
                    )} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{playlist.name}</h3>
                    <p className="text-sm text-muted-foreground">
                    🎵 {trackCountByPlaylist[playlist.id] || 0} músicas
                        </p>
                    {playlist.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {playlist.description}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                       onSelect={(e) => { e.preventDefault(); openTracks(playlist.id);
                           }}
                            >
                             Músicas
                              </DropdownMenuItem>


                    <DropdownMenuItem onClick={() => { setEditingPlaylist(playlist); setDialogOpen(true); }}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive"
                      onClick={() => handleDelete(playlist.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-wrap gap-2">
                {playlist.is_global && (
                  <Badge variant="secondary" className="bg-accent/20 text-accent border-accent/30">
                    Global
                  </Badge>
                )}
                {playlist.period && (
                  <Badge variant="outline">
                    {getPeriodLabel(playlist.period)}
                  </Badge>
                )}
                {!playlist.is_active && (
                  <Badge variant="outline" className="text-muted-foreground">
                    Inativa
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredPlaylists.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {search ? 'Nenhuma playlist encontrada' : 'Nenhuma playlist cadastrada'}
            </p>
          </div>
        )}

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="glass-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {editingPlaylist ? 'Editar Playlist' : 'Nova Playlist'}
              </DialogTitle>
            </DialogHeader>
            

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
  control={form.control}
  name="scope"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Onde tocar?</FormLabel>
      {form.watch('scope') === 'selected_stores' && (
  <FormField
    control={form.control}
    name="store_ids"
    render={({ field }) => (
      <FormItem>
        <FormLabel>Selecione as lojas</FormLabel>
        <div className="space-y-2 max-h-44 overflow-auto rounded-md border border-border p-3">
          {stores.map((store) => {
            const checked = (field.value || []).includes(store.id);

            return (
              <label key={store.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const current = field.value || [];
                    if (e.target.checked) {
                      field.onChange([...current, store.id]);
                    } else {
                      field.onChange(current.filter((id: string) => id !== store.id));
                    }
                  }}
                />
                <span>{store.name}</span>
              </label>
            );
          })}
        </div>
        <FormMessage />
      </FormItem>
    )}
  />
)}

      <Select onValueChange={field.onChange} value={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="store">Somente esta loja</SelectItem>
          <SelectItem value="all_assigned">Todas as minhas lojas</SelectItem>
          <SelectItem value="selected_stores">Selecionar lojas específicas</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Pop Brasileiro" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Descrição da playlist" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_global"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div>
                        <FormLabel className="text-base">Playlist Global</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Disponível para todas as lojas
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {!isGlobal && (
                  <FormField
                    control={form.control}
                    name="store_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Loja</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma loja" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {stores.map((store) => (
                              <SelectItem key={store.id} value={store.id}>
                                {store.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Período (opcional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Qualquer período" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="morning">Manhã</SelectItem>
                          <SelectItem value="afternoon">Tarde</SelectItem>
                          <SelectItem value="night">Noite</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <FormLabel className="text-base">Ativa</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingPlaylist ? 'Salvar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      <PlaylistTracksDialog
  open={tracksOpen}
  onOpenChange={(v) => {
    setTracksOpen(v);
    if (!v) {
      setTracksPlaylistId(null);
      fetchData();
    }
  }}
  playlistId={tracksPlaylistId}
  onChanged={fetchData}
/>

    </MainLayout>
  );
}
