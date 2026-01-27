import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Megaphone,
  MoreVertical,
  Trash2,
  Edit2,
  Upload,
  Play,
  Clock,
  Calendar
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Announcement, Store, AnnouncementTarget } from '@/lib/supabase-types';
import { getTargetLabel, formatDuration } from '@/lib/supabase-types';
import { cn } from '@/lib/utils';
import { AnnouncementScheduleManager } from '@/components/announcements/AnnouncementScheduleManager';

const announcementSchema = z.object({
  title: z.string().min(2, 'Título deve ter pelo menos 2 caracteres'),
  description: z.string().optional(),
  target_type: z.enum(['individual', 'group', 'global']),
  priority: z.number().min(1).max(5),
  category: z.string().optional(),
  is_active: z.boolean(),
  store_ids: z.array(z.string()).optional(),
});

type AnnouncementFormData = z.infer<typeof announcementSchema>;

const categoryOptions = [
  { value: 'promocao', label: 'Promoção' },
  { value: 'funcionario', label: 'Chamada de Funcionário' },
  { value: 'estacionamento', label: 'Estacionamento' },
  { value: 'abertura', label: 'Abertura' },
  { value: 'encerramento', label: 'Encerramento' },
  { value: 'sazonal', label: 'Mensagem Sazonal' },
  { value: 'outro', label: 'Outro' },
];

export default function AnnouncementsPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [currentPlayingUrl, setCurrentPlayingUrl] = useState<string | null>(null);


  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [announcementStores, setAnnouncementStores] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleAnnouncement, setScheduleAnnouncement] = useState<Announcement | null>(null);

  const form = useForm<AnnouncementFormData>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      description: '',
      target_type: 'global',
      priority: 3,
      category: '',
      is_active: true,
      store_ids: [],
    },
  });

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

  useEffect(() => {
    if (editingAnnouncement) {
      const storeIds = announcementStores[editingAnnouncement.id] || [];
      form.reset({
        title: editingAnnouncement.title,
        // ✅ esses campos podem não existir no banco (mantemos a UI e evitamos quebrar)
        description: (editingAnnouncement as any).description || '',
        target_type: ((editingAnnouncement as any).target_type || 'global') as any,
        priority: (editingAnnouncement as any).priority ?? 3,
        category: (editingAnnouncement as any).category || '',
        is_active: editingAnnouncement.is_active,
        store_ids: storeIds,
      });
      setAudioUrl(editingAnnouncement.file_url);
    } else {
      form.reset({
        title: '',
        description: '',
        target_type: 'global',
        priority: 3,
        category: '',
        is_active: true,
        store_ids: [],
      });
      setAudioFile(null);
      setAudioUrl(null);
    }
  }, [editingAnnouncement, form, announcementStores]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [announcementsRes, storesRes, announcementStoresRes] = await Promise.all([
  (supabase as any).from('announcements').select('*').order('created_at', { ascending: false }),
  (supabase as any).from('stores').select('*').eq('status', 'active'),
  (supabase as any).from('announcement_stores').select('*'),
]);

      if (announcementsRes.data) setAnnouncements(announcementsRes.data as any);  
      if (storesRes.data) setStores(storesRes.data as any);

      if (announcementStoresRes.data) {
        const storeMap: Record<string, string[]> = {};
        announcementStoresRes.data.forEach((as: any) => {
          if (!storeMap[as.announcement_id]) {
            storeMap[as.announcement_id] = [];
          }
          storeMap[as.announcement_id].push(as.store_id);
        });
        setAnnouncementStores(storeMap);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        toast.error('Por favor, selecione um arquivo de áudio');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 50MB');
        return;
      }
      setAudioFile(file);
      setAudioUrl(URL.createObjectURL(file));
    }
  };

  const uploadAudio = async (): Promise<string | null> => {
    if (!audioFile) return audioUrl;

    setUploadingFile(true);
    try {
      const fileName = `${Date.now()}-${audioFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const { data, error } = await supabase.storage
        .from('audio-files')
        .upload(`announcements/${fileName}`, audioFile, {
          contentType: audioFile.type || 'audio/mpeg',
          upsert: false,
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('audio-files')
        .getPublicUrl(data.path);

      return urlData.publicUrl;
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || 'Erro ao fazer upload do áudio');
      return null;
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async (data: AnnouncementFormData) => {
    try {
      let fileUrl = audioUrl;

      if (audioFile) {
        fileUrl = await uploadAudio();
        if (!fileUrl) return;
      }

      if (!fileUrl && !editingAnnouncement) {
        toast.error('Por favor, selecione um arquivo de áudio');
        return;
      }

      // ✅ MUITO IMPORTANTE:
      // A tabela announcements (no seu Supabase) só tem:
      // title, file_url, is_active, store_id, created_at, id
      // Então aqui enviamos SOMENTE colunas existentes, pra não dar 400/PGST204.
      const payload = {
        title: data.title,
        file_url: fileUrl!,
        is_active: data.is_active,
        store_id:
          data.target_type === 'individual' && data.store_ids && data.store_ids.length > 0
            ? data.store_ids[0]
            : null,
      };

      let announcementId: string;

      if (editingAnnouncement) {
        const { error } = await supabase
          .from('announcements')
          .update(payload)
          .eq('id', editingAnnouncement.id);

        if (error) throw error;
        announcementId = editingAnnouncement.id;

        // Update store relationships
        const { error: delRelErr } = await (supabase as any)
  .from('announcement_stores')
  .delete()
  .eq('announcement_id', announcementId);

if (delRelErr) throw delRelErr;


        toast.success('Aviso atualizado!');
      } else {
        const { data: newAnnouncement, error } = await supabase
          .from('announcements')
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        announcementId = newAnnouncement.id;
        toast.success('Aviso criado!');
      }

      // Add store relationships for individual/group
      if (data.target_type !== 'global' && data.store_ids && data.store_ids.length > 0) {
        const storeRelations = data.store_ids.map(storeId => ({
          announcement_id: announcementId,
          store_id: storeId,
        }));

       const { error: relErr } = await (supabase as any)
  .from('announcement_stores')
  .insert(storeRelations);

if (relErr) throw relErr;

        if (relErr) throw relErr;
      }

      setDialogOpen(false);
      setEditingAnnouncement(null);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar aviso');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este aviso?')) return;

    try {
      const { error } = await supabase.from('announcements').delete().eq('id', id);
      if (error) throw error;
      toast.success('Aviso excluído!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir aviso');
    }
  };

  const playAudio = async (url: string) => {
  try {
    // se ainda não existe, cria uma vez
    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio();
    }

    const audio = audioPlayerRef.current;

    // se clicou no mesmo áudio:
    if (currentPlayingUrl === url) {
      if (!audio.paused) {
        audio.pause();
      } else {
        await audio.play();
      }
      return;
    }

    // se é outro áudio, para o anterior e toca o novo
    audio.pause();
    audio.currentTime = 0;

    audio.src = url;
    setCurrentPlayingUrl(url);

    await audio.play();
  } catch (e) {
    console.error(e);
    toast.error('Não foi possível reproduzir o áudio');
  }
};


  const filteredAnnouncements = announcements.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase())
  );

  const targetType = form.watch('target_type');

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
            <h1 className="text-3xl font-bold text-foreground">Avisos</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie os avisos de áudio
            </p>
          </div>
          <Button onClick={() => { setEditingAnnouncement(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Aviso
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar avisos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className={cn(
                'glass-card rounded-xl border p-6 transition-all duration-300',
                'hover:shadow-lg hover:border-primary/20',
                !announcement.is_active && 'opacity-60'
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'p-3 rounded-lg',
                    (announcement as any).target_type === 'global' ? 'bg-accent/20' : 'bg-warning/20'
                  )}>
                    <Megaphone className={cn(
                      'w-6 h-6',
                      (announcement as any).target_type === 'global' ? 'text-accent' : 'text-warning'
                    )} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{announcement.title}</h3>
                    {(announcement as any).category && (
                      <p className="text-sm text-muted-foreground capitalize">
                        {categoryOptions.find(c => c.value === (announcement as any).category)?.label || (announcement as any).category}
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
                    <DropdownMenuItem onClick={() => playAudio(announcement.file_url)}>
                      <Play className="w-4 h-4 mr-2" />
                      Reproduzir
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setEditingAnnouncement(announcement); setDialogOpen(true); }}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setScheduleAnnouncement(announcement); setScheduleDialogOpen(true); }}>
                      <Clock className="w-4 h-4 mr-2" />
                      Agendamento
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(announcement.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <Badge
                  variant="secondary"
                  className={cn(
                    (announcement as any).target_type === 'global' && 'bg-accent/20 text-accent border-accent/30',
                    (announcement as any).target_type === 'group' && 'bg-warning/20 text-warning border-warning/30',
                    (announcement as any).target_type === 'individual' && 'bg-primary/20 text-primary border-primary/30'
                  )}
                >
                  {getTargetLabel(((announcement as any).target_type || 'global') as any)}
                </Badge>
                <Badge variant="outline">
                  Prioridade {(announcement as any).priority ?? 3}
                </Badge>
                {(announcement as any).duration_seconds && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration((announcement as any).duration_seconds)}
                  </Badge>
                )}
              </div>

              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => playAudio(announcement.file_url)}
              >
                <Play className="w-4 h-4 mr-2" />
                Reproduzir
              </Button>
            </div>
          ))}
        </div>

        {filteredAnnouncements.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {search ? 'Nenhum aviso encontrado' : 'Nenhum aviso cadastrado'}
            </p>
          </div>
        )}

        {/* Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="glass-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {editingAnnouncement ? 'Editar Aviso' : 'Novo Aviso'}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Promoção de Fim de Semana" {...field} />
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
                        <Textarea placeholder="Descrição do aviso" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Audio Upload */}
                <div className="space-y-2">
                  <FormLabel>Arquivo de Áudio</FormLabel>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {audioUrl ? (
                      <div className="space-y-2">
                        <audio controls src={audioUrl} className="w-full" />
                        <p className="text-sm text-muted-foreground">
                          Clique para trocar o arquivo
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Clique ou arraste um arquivo MP3
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="target_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Alvo</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="global">Global (Todas as lojas)</SelectItem>
                          <SelectItem value="group">Grupo (Lojas selecionadas)</SelectItem>
                          <SelectItem value="individual">Individual (Uma loja)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {targetType !== 'global' && (
                  <FormField
                    control={form.control}
                    name="store_ids"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {targetType === 'individual' ? 'Loja' : 'Lojas'}
                        </FormLabel>
                        <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                          {stores.map((store) => (
                            <div key={store.id} className="flex items-center gap-2">
                              <Checkbox
                                checked={field.value?.includes(store.id)}
                                onCheckedChange={(checked) => {
                                  if (targetType === 'individual') {
                                    field.onChange(checked ? [store.id] : []);
                                  } else {
                                    const current = field.value || [];
                                    if (checked) {
                                      field.onChange([...current, store.id]);
                                    } else {
                                      field.onChange(current.filter(id => id !== store.id));
                                    }
                                  }
                                }}
                              />
                              <span className="text-sm">{store.name}</span>
                            </div>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categoryOptions.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade (1-5)</FormLabel>
                      <Select
                        onValueChange={(v) => field.onChange(parseInt(v))}
                        value={field.value.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1 - Baixa</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3 - Normal</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                          <SelectItem value="5">5 - Urgente</SelectItem>
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
                      <FormLabel className="text-base">Ativo</FormLabel>
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
                  <Button type="submit" className="flex-1" disabled={uploadingFile}>
                    {uploadingFile ? 'Enviando...' : (editingAnnouncement ? 'Salvar' : 'Criar')}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Schedule Dialog */}
        <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
          <DialogContent className="glass-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Agendamento: {scheduleAnnouncement?.title}
              </DialogTitle>
            </DialogHeader>
            {scheduleAnnouncement && (
              <AnnouncementScheduleManager
                announcementId={scheduleAnnouncement.id}
                onClose={() => setScheduleDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
