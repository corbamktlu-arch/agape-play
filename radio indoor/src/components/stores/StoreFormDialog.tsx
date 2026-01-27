import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

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

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { Loader2 } from 'lucide-react';
import type { Store } from '@/lib/supabase-types';
import { supabase } from '@/integrations/supabase/client';

const storeSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  code: z
    .string()
    .min(2, 'Código deve ter pelo menos 2 caracteres')
    .max(20)
    .regex(/^[A-Z0-9]+$/, 'Apenas letras maiúsculas e números'),
  status: z.enum(['active', 'inactive']),
  default_volume: z.number().min(0).max(100),
  address: z.string().max(200).optional(),
  active_playlist_id: z.string().uuid().optional().nullable(),
});

type StoreFormData = z.infer<typeof storeSchema>;

interface StoreFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  store?: Store | null;
  onSubmit: (data: StoreFormData) => Promise<void>;
}

export function StoreFormDialog({
  open,
  onOpenChange,
  store,
  onSubmit,
}: StoreFormDialogProps) {
  const [loading, setLoading] = useState(false);
  const [playlists, setPlaylists] = useState<{ id: string; name: string }[]>([]);

  const form = useForm<StoreFormData>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: '',
      code: '',
      status: 'active',
      default_volume: 70,
      address: '',
      active_playlist_id: null,
    },
  });

  // Reset do form quando abre para editar/criar
  useEffect(() => {
    if (store) {
      form.reset({
        name: store.name,
        code: store.code,
        status: store.status as any,
        default_volume: (store as any).default_volume ?? 70,
        address: store.address || '',
        active_playlist_id: (store as any).active_playlist_id || null,
      });
    } else {
      form.reset({
        name: '',
        code: '',
        status: 'active',
        default_volume: 70,
        address: '',
        active_playlist_id: null,
      });
    }
  }, [store, form]);

  // Carregar playlists quando o modal abrir
  useEffect(() => {
    if (!open) return;

    const loadPlaylists = async () => {
      const res: any = await (supabase as any)
        .from('playlists')
        .select('id,name')
        .eq('is_active', true)
        .order('name');

      if (!res?.error) {
        setPlaylists(res?.data || []);
      } else {
        setPlaylists([]);
      }
    };

    loadPlaylists();
  }, [open]);

  const handleSubmit = async (data: StoreFormData) => {
    setLoading(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {store ? 'Editar Loja' : 'Nova Loja'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Nome */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Loja</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Loja Centro" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Código */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: LOJA001"
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Endereço */}
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Rua Principal, 100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Ativa</SelectItem>
                      <SelectItem value="inactive">Inativa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Playlist ativa */}
            <FormField
              control={form.control}
              name="active_playlist_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Playlist ativa (opcional)</FormLabel>

                  <Select
                    onValueChange={(v) =>
                      field.onChange(v === 'none' ? null : v)
                    }
                    value={field.value ?? 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma playlist" />
                      </SelectTrigger>
                    </FormControl>

                    <SelectContent>
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {playlists.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Volume */}
            <FormField
              control={form.control}
              name="default_volume"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Volume Padrão: {field.value}%</FormLabel>
                  <FormControl>
                    <Slider
                      value={[field.value]}
                      min={0}
                      max={100}
                      step={5}
                      onValueChange={(values) => field.onChange(values[0])}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botões */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>

              <Button type="submit" className="flex-1" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {store ? 'Salvar' : 'Criar Loja'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
