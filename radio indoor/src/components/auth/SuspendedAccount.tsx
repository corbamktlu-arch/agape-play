import { AlertTriangle, Phone, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function SuspendedAccount() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-destructive/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-destructive/5 rounded-full blur-3xl" />
      </div>

      <div className="glass-card w-full max-w-md p-8 rounded-2xl border border-destructive/30 relative animate-scale-in">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mb-6">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-2">
            Conta Suspensa
          </h1>

          <p className="text-muted-foreground mb-6">
            Sua conta foi temporariamente suspensa. O acesso ao sistema e ao player de rádio está bloqueado.
          </p>

          {profile?.suspended_reason && (
            <div className="w-full bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-destructive mb-1">Motivo:</p>
              <p className="text-sm text-muted-foreground">{profile.suspended_reason}</p>
            </div>
          )}

          <div className="w-full space-y-3 mb-6">
            <p className="text-sm text-muted-foreground">
              Entre em contato com o suporte para mais informações:
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>suporte@radioindoor.com</span>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Phone className="w-4 h-4" />
              <span>(11) 99999-9999</span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={signOut}
          >
            Sair da Conta
          </Button>
        </div>
      </div>
    </div>
  );
}
