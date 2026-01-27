import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Settings, 
  User, 
  Bell, 
  Palette, 
  Database,
  Shield,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name);
    }
  }, [profile]);

  const handleUpdateProfile = async () => {
    if (!user || !fullName.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Perfil atualizado com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const settingsSections = [
    {
      icon: User,
      title: 'Perfil',
      description: 'Gerencie suas informações pessoais',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              O email não pode ser alterado
            </p>
          </div>
          <Button onClick={handleUpdateProfile} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      ),
    },
    {
      icon: Bell,
      title: 'Notificações',
      description: 'Configure como receber notificações',
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Notificações do Sistema</Label>
              <p className="text-sm text-muted-foreground">
                Receber alertas sobre status das lojas
              </p>
            </div>
            <Switch
              checked={notifications}
              onCheckedChange={setNotifications}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Alertas de Desconexão</Label>
              <p className="text-sm text-muted-foreground">
                Notificar quando uma loja ficar offline
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      ),
    },
    {
      icon: Database,
      title: 'Armazenamento',
      description: 'Informações sobre uso de dados',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Áudios armazenados</span>
              <span className="font-medium">--</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Músicas</span>
              <span className="font-medium">--</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Avisos</span>
              <span className="font-medium">--</span>
            </div>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            Os arquivos são armazenados de forma segura na nuvem
          </p>
        </div>
      ),
    },
    {
      icon: Shield,
      title: 'Segurança',
      description: 'Configurações de acesso e permissões',
      content: (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <p className="text-sm text-muted-foreground">
              Sua conta está protegida com autenticação segura.
              Para alterar sua senha, use a opção de recuperação de senha na tela de login.
            </p>
          </div>
          <Button variant="outline" className="w-full">
            Alterar Senha
          </Button>
        </div>
      ),
    },
    {
      icon: HelpCircle,
      title: 'Sobre',
      description: 'Informações sobre o sistema',
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Versão</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ambiente</span>
              <span className="font-medium">Produção</span>
            </div>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            ÁgapePlay - Sistema de Som para Lojas
            <br />
            Desenvolvido por Ágape Tech Hub 
          </p>
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-8 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas preferências e configurações do sistema
          </p>
        </div>

        {/* Settings Cards */}
        <div className="grid gap-6">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.title} className="glass-card border-border">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription>{section.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>{section.content}</CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
}
