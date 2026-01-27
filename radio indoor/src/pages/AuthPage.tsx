import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const authSchema = z.object({
  email: z.string().email('Email inválido').max(255),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres').max(100),
  fullName: z.string().max(100).optional(),
});

type AuthFormData = z.infer<typeof authSchema>;

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
    },
  });

  const onSubmit = async (data: AuthFormData) => {
    setLoading(true);
    try {
      if (isSignUp) {
        if (!data.fullName || data.fullName.trim().length < 2) {
          toast.error('Digite seu nome para cadastrar');
          return;
        }

        const { error } = await signUp(
          data.email,
          data.password,
          data.fullName.trim() || 'Usuário'
        );

        if (error) {
          if (error.message.includes('already registered')) {
            toast.error('Este email já está cadastrado');
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success('Conta criada com sucesso!');
        navigate('/dashboard');
      } else {
        const { error } = await signIn(data.email, data.password);

        if (error) {
          if (error.message.includes('Invalid login')) {
            toast.error('Email ou senha incorretos');
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success('Bem-vindo de volta!');
        navigate('/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      {/* Background Effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="glass-card w-full max-w-md p-8 rounded-2xl border border-border relative z-10 animate-scale-in">
        {/* Logo + Título */}
        <div className="flex flex-col items-center mb-8">
  <div className="w-full flex justify-center mb-6">
  <img
    src="/logo.png"
    alt="Logo ÁgapePlay"
    className="w-full max-w-sm object-contain"
  />
</div>


          <h1 className="text-3xl font-extrabold text-foreground"></h1>
          <p className="text-muted-foreground mt-1"></p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8">
          <Button
            type="button"
            variant={!isSignUp ? 'default' : 'ghost'}
            className="flex-1"
            onClick={() => setIsSignUp(false)}
          >
            Entrar
          </Button>
          <Button
            type="button"
            variant={isSignUp ? 'default' : 'ghost'}
            className="flex-1"
            onClick={() => setIsSignUp(true)}
          >
            Cadastrar
          </Button>
        </div>

        {/* Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {isSignUp && (
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem className="animate-slide-in">
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="seu@email.com" {...field} />
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
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        {...field}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSignUp ? 'Criar Conta' : 'Entrar'}
            </Button>
          </form>
        </Form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
          <button
            type="button"
            className="text-primary hover:underline font-medium"
            onClick={() => setIsSignUp((v) => !v)}
          >
            {isSignUp ? 'Entrar' : 'Cadastrar'}
          </button>
        </p>
      </div>
    </div>
  );
}
