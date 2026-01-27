import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  MoreVertical,
  Trash2,
  Edit2,
  Shield,
  ShieldCheck,
  ShieldX,
  Store,
  Ban,
  CheckCircle,
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
  DropdownMenuSeparator,
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

import { Textarea } from '@/components/ui/textarea';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { cn } from '@/lib/utils';

// ✅ Manager: esta página vai virar a tela de Operadores
import OperatorsPage from '@/pages/manager/OperatorsPage';

// ===================
// Tipos REAIS do banco
// ===================
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type RoleRow = Database['public']['Tables']['user_roles']['Row'];
type AssignmentRow = Database['public']['Tables']['user_store_assignments']['Row'];

type AppRole = 'admin' | 'manager' | 'operator';
type StoreLite = { id: string; name: string };

type UserWithRole = ProfileRow & {
  role?: AppRole;
  stores?: string[];
};

const userSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').optional(),
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  role: z.enum(['admin', 'manager', 'operator']),
  store_ids: z.array(z.string()),
});

type UserFormData = z.infer<typeof userSchema>;

export default function UsersPage() {
  const { user, loading: authLoading, isAdmin, isManager } = useAuth();
  const navigate = useNavigate();

  // ✅ Manager vê a tela de Operadores nessa rota /users
  if (isManager && !isAdmin) {
    return <OperatorsPage />;
  }

  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [stores, setStores] = useState<StoreLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);

  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [suspendingUser, setSuspendingUser] = useState<UserWithRole | null>(null);
  const [suspendReason, setSuspendReason] = useState('');

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      role: 'operator',
      store_ids: [],
    },
  });

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user && isAdmin) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]);

  useEffect(() => {
    if (editingUser) {
      form.reset({
        email: (editingUser.email ?? '') || '',
        password: '',
        fullName: editingUser.full_name ?? '',
        role: (editingUser.role ?? 'operator') as AppRole,
        store_ids: editingUser.stores ?? [],
      });
    } else {
      form.reset({
        email: '',
        password: '',
        fullName: '',
        role: 'operator',
        store_ids: [],
      });
    }
  }, [editingUser, form]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: rolesData, error: rolesErr } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesErr) throw rolesErr;

      const { data: assignmentsData, error: assErr } = await supabase
        .from('user_store_assignments')
        .select('*');

      if (assErr) throw assErr;

      const { data: storesData, error: storesErr } = await supabase
        .from('stores')
        .select('id,name')
        .eq('status', 'active')
        .order('name');

      if (storesErr) throw storesErr;

      setStores(
        (storesData ?? []).map((s: any) => ({
          id: String(s.id),
          name: String(s.name),
        }))
      );

      const roles = (rolesData ?? []) as RoleRow[];
      const assigns = (assignmentsData ?? []) as AssignmentRow[];

      const usersWithRoles: UserWithRole[] = ((profilesData ?? []) as ProfileRow[]).map((profile) => {
        const roleRecord = roles.find((r) => r.user_id === profile.user_id);
        const storeAssignments = assigns.filter((a) => a.user_id === profile.user_id);

        return {
          ...profile,
          role: (roleRecord?.role as AppRole) ?? undefined,
          stores: storeAssignments.map((a) => String(a.store_id)),
        };
      });

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: UserFormData) => {
    try {
      if (editingUser) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: data.fullName,
          })
          .eq('user_id', editingUser.user_id);

        if (profileError) throw profileError;

        await supabase
          .from('user_roles')
          .update({ role: data.role })
          .eq('user_id', editingUser.user_id);

        await supabase
          .from('user_store_assignments')
          .delete()
          .eq('user_id', editingUser.user_id);

        if (data.store_ids.length > 0) {
          await supabase.from('user_store_assignments').insert(
            data.store_ids.map((storeId) => ({
              user_id: editingUser.user_id,
              store_id: storeId,
            }))
          );
        }

        toast.success('Usuário atualizado!');
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: data.email,
          password: data.password!,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Erro ao criar usuário');

        await supabase.from('profiles').insert({
          user_id: authData.user.id,
          full_name: data.fullName,
          email: data.email,
          account_status: 'active',
          created_by: user?.id ?? null,
        });

        await supabase.from('user_roles').insert({
          user_id: authData.user.id,
          role: data.role,
        });

        if (data.store_ids.length > 0) {
          await supabase.from('user_store_assignments').insert(
            data.store_ids.map((storeId) => ({
              user_id: authData.user!.id,
              store_id: storeId,
            }))
          );
        }

        toast.success('Usuário criado! Um email de confirmação foi enviado.');
      }

      setDialogOpen(false);
      setEditingUser(null);
      fetchData();
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast.error(error.message || 'Erro ao salvar usuário');
    }
  };

  const handleSuspend = async () => {
    if (!suspendingUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          account_status: 'suspended',
          suspended_reason: suspendReason || null,
          suspended_at: new Date().toISOString(),
        })
        .eq('user_id', suspendingUser.user_id);

      if (error) throw error;

      toast.success('Conta suspensa!');
      setSuspendDialogOpen(false);
      setSuspendingUser(null);
      setSuspendReason('');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao suspender conta');
    }
  };

  const handleReactivate = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          account_status: 'active',
          suspended_reason: null,
          suspended_at: null,
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Conta reativada!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao reativar conta');
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) return;

    try {
      const { error } = await supabase.from('profiles').delete().eq('user_id', userId);
      if (error) throw error;

      toast.success('Usuário excluído!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir usuário');
    }
  };

  const getRoleIcon = (role?: AppRole) => {
    switch (role) {
      case 'admin':
        return <ShieldCheck className="w-4 h-4 text-primary" />;
      case 'manager':
        return <Shield className="w-4 h-4 text-accent" />;
      default:
        return <ShieldX className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getRoleLabelLocal = (role?: AppRole) => {
    if (role === 'admin') return 'Administrador';
    if (role === 'manager') return 'Gerente';
    return 'Operador';
  };

  const getAccountStatusLabelLocal = (s?: string | null) => {
    if (s === 'active') return 'Ativa';
    if (s === 'suspended') return 'Suspensa';
    return 'Indefinida';
  };

  const filteredUsers = users.filter((u) =>
    (u.full_name ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const selectedRole = form.watch('role');

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ✅ CORREÇÃO: função completa (sem blocos duplicados fora dela)
  const handleResetPassword = async (targetUserId: string) => {
    if (!confirm("Resetar senha e gerar uma senha temporária?")) return;
    // ✅ TESTE: ver se tem sessão/token quando clica no reset
const { data: s, error: sessErr } = await supabase.auth.getSession();
console.log("sessErr:", sessErr);
console.log("TEM SESSION?", !!s?.session);
console.log("USER ID:", s?.session?.user?.id);
console.log("TOKEN INICIO:", s?.session?.access_token?.slice(0, 20));


    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      toast.error("Erro ao pegar sessão: " + sessionError.message);
      return;
    }

    const session = sessionData?.session;
    if (!session) {
      toast.error("Você precisa estar logado para resetar senha.");
      return;
    }

    const token = s?.session?.access_token;

if (!token) {
  toast.error("Sem sessão/token. Faça login novamente.");
  return;
}

const { data, error } = await supabase.functions.invoke("reset-user-password", {
  body: { user_id: targetUserId },
  headers: {
    Authorization: `Bearer ${token}`,
  },
});


    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }

    const temp = (data as any)?.temp_password;
    if (!temp) {
      toast.error("Não retornou senha temporária.");
      return;
    }

    try {
      await navigator.clipboard.writeText(temp);
      toast.success(`Senha temporária: ${temp} (copiada)`);
    } catch {
      alert(`Senha temporária: ${temp}`);
    }
  };

  if (!isAdmin) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Usuários</h1>
            <p className="text-muted-foreground mt-1">Gerencie usuários e permissões</p>
          </div>
          <Button onClick={() => { setEditingUser(null); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuários..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((userItem) => (
            <div
              key={userItem.user_id}
              className={cn(
                'glass-card rounded-xl border p-6 transition-all duration-300',
                'hover:shadow-lg hover:border-primary/20',
                userItem.account_status === 'suspended' && 'opacity-60 border-destructive/30'
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center',
                      userItem.account_status === 'suspended' ? 'bg-destructive/20' : 'bg-primary/20'
                    )}
                  >
                    <span
                      className={cn(
                        'text-lg font-semibold',
                        userItem.account_status === 'suspended' ? 'text-destructive' : 'text-primary'
                      )}
                    >
                      {(userItem.full_name ?? 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-semibold text-foreground">{userItem.full_name ?? 'Sem nome'}</h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      {getRoleIcon(userItem.role)}
                      <span>{getRoleLabelLocal(userItem.role)}</span>
                    </div>
                  </div>
                </div>

                {userItem.user_id !== user?.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setEditingUser(userItem); setDialogOpen(true); }}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {userItem.account_status === 'suspended' ? (
                        <DropdownMenuItem onClick={() => handleReactivate(userItem.user_id)}>
                          <CheckCircle className="w-4 h-4 mr-2 text-success" />
                          Reativar Conta
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => { setSuspendingUser(userItem); setSuspendDialogOpen(true); }}>
                          <Ban className="w-4 h-4 mr-2 text-warning" />
                          Suspender Conta
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem onClick={() => handleResetPassword(userItem.user_id)}>
                        Resetar Senha (Temp)
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(userItem.user_id)}>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={userItem.account_status === 'suspended' ? 'destructive' : 'secondary'}
                  className={cn(userItem.account_status === 'active' && 'bg-success/20 text-success border-success/30')}
                >
                  {getAccountStatusLabelLocal(userItem.account_status)}
                </Badge>

                {userItem.stores && userItem.stores.length > 0 && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Store className="w-3 h-3" />
                    {userItem.stores.length} loja{userItem.stores.length > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {search ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
            </p>
          </div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="glass-card border-border max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {!editingUser && (
                  <>
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="usuario@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}

                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do usuário" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {isAdmin && (
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Papel</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="admin">Administrador</SelectItem>
                            <SelectItem value="manager">Gerente</SelectItem>
                            <SelectItem value="operator">Operador</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          {selectedRole === 'admin' && 'Acesso total ao sistema'}
                          {selectedRole === 'manager' && 'Gerencia múltiplas lojas e usuários'}
                          {selectedRole === 'operator' && 'Acesso restrito às lojas atribuídas'}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {(selectedRole === 'manager' || selectedRole === 'operator') && (
                  <FormField
                    control={form.control}
                    name="store_ids"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lojas Atribuídas</FormLabel>
                        <div className="space-y-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                          {stores.map((store) => (
                            <div key={store.id} className="flex items-center gap-2">
                              <Checkbox
                                checked={field.value?.includes(store.id)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) field.onChange([...current, store.id]);
                                  else field.onChange(current.filter((id) => id !== store.id));
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

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="ghost" className="flex-1" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingUser ? 'Salvar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Suspend Dialog */}
        <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
          <DialogContent className="glass-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Suspender Conta</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <p className="text-muted-foreground">
                Tem certeza que deseja suspender a conta de{' '}
                <strong>{suspendingUser?.full_name ?? 'este usuário'}</strong>?
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium">Motivo (opcional)</label>
                <Textarea
                  placeholder="Informe o motivo da suspensão..."
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1"
                  onClick={() => {
                    setSuspendDialogOpen(false);
                    setSuspendingUser(null);
                    setSuspendReason('');
                  }}
                >
                  Cancelar
                </Button>
                <Button type="button" variant="destructive" className="flex-1" onClick={handleSuspend}>
                  Suspender
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
