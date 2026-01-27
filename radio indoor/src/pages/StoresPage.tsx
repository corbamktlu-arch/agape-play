import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { StoreCard } from '@/components/stores/StoreCard';
import { StoreFormDialog } from '@/components/stores/StoreFormDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Store, PlayerSession } from '@/lib/supabase-types';

export default function StoresPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stores, setStores] = useState<Store[]>([]);
  const [sessions, setSessions] = useState<PlayerSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!authLoading && user) {
      fetchStores();
    }
  }, [authLoading, user]);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const [storesRes, sessionsRes] = await Promise.all([
        supabase.from('stores').select('*').order('name'),
        supabase.from('player_sessions').select('*'),
      ]);

      if (storesRes.error) throw storesRes.error;
      if (sessionsRes.error) throw sessionsRes.error;

      if (storesRes.data) setStores(storesRes.data as unknown as Store[]);
      if (sessionsRes.data) setSessions(sessionsRes.data as unknown as PlayerSession[]);
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSessionForStore = (storeId: string) => {
    return sessions.find(s => s.store_id === storeId);
  };

  const handleSubmit = async (data: any) => {
    try {
      if (editingStore) {
        const { error } = await supabase
          .from('stores')
          .update(data)
          .eq('id', editingStore.id);

        if (error) throw error;
        toast.success('Loja atualizada com sucesso!');
      } else {
        const { error } = await supabase.from('stores').insert(data);
        if (error) {
          if (error.code === '23505') {
            toast.error('Já existe uma loja com este código');
            return;
          }
          throw error;
        }
        toast.success('Loja criada com sucesso!');
      }
      setDialogOpen(false);
      setEditingStore(null);
      fetchStores();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar loja');
    }
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setDialogOpen(true);
  };

  const filteredStores = stores.filter(store =>
    store.name.toLowerCase().includes(search.toLowerCase()) ||
    store.code.toLowerCase().includes(search.toLowerCase())
  );

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
            <h1 className="text-3xl font-bold text-foreground">Lojas</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as lojas da sua rede
            </p>
          </div>
          <Button onClick={() => { setEditingStore(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Loja
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              session={getSessionForStore(store.id)}
              onEdit={() => handleEdit(store)}
              onViewPlayer={() => navigate(`/player?store=${store.id}`)}
            />
          ))}
        </div>

        {filteredStores.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {search ? 'Nenhuma loja encontrada' : 'Nenhuma loja cadastrada'}
            </p>
          </div>
        )}

        {/* Dialog */}
        <StoreFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          store={editingStore}
          onSubmit={handleSubmit}
        />
      </div>
    </MainLayout>
  );
}
