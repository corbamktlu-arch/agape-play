import { useState, useEffect } from 'react';
import { Clock, Calendar, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AnnouncementSchedule, AnnouncementFrequency } from '@/lib/supabase-types';
import { getFrequencyLabel } from '@/lib/supabase-types';
import { cn } from '@/lib/utils';

const scheduleSchema = z.object({
  frequency: z.enum(['15min', '30min', '1hour']),
  start_time: z.string().min(1, 'Horário de início obrigatório'),
  end_time: z.string().min(1, 'Horário de término obrigatório'),
  days_of_week: z.array(z.number()).min(1, 'Selecione pelo menos um dia'),
  is_active: z.boolean(),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

interface AnnouncementScheduleManagerProps {
  announcementId: string;
  onClose: () => void;
}

const daysOfWeek = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
];

export function AnnouncementScheduleManager({ 
  announcementId, 
  onClose 
}: AnnouncementScheduleManagerProps) {
  const [schedules, setSchedules] = useState<AnnouncementSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<AnnouncementSchedule | null>(null);

  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      frequency: '30min',
      start_time: '08:00',
      end_time: '22:00',
      days_of_week: [1, 2, 3, 4, 5],
      is_active: true,
    },
  });

  useEffect(() => {
    fetchSchedules();
  }, [announcementId]);

  useEffect(() => {
    if (editingSchedule) {
      form.reset({
        frequency: editingSchedule.frequency as AnnouncementFrequency,
        start_time: editingSchedule.start_time?.slice(0, 5) || '08:00',
        end_time: editingSchedule.end_time?.slice(0, 5) || '22:00',
        days_of_week: editingSchedule.days_of_week || [1, 2, 3, 4, 5],
        is_active: editingSchedule.is_active,
      });
    } else {
      form.reset({
        frequency: '30min',
        start_time: '08:00',
        end_time: '22:00',
        days_of_week: [1, 2, 3, 4, 5],
        is_active: true,
      });
    }
  }, [editingSchedule, form]);

  const fetchSchedules = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcement_schedules')
        .select('*')
        .eq('announcement_id', announcementId)
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSchedules(data as AnnouncementSchedule[]);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: ScheduleFormData) => {
    try {
      const payload = {
        announcement_id: announcementId,
        frequency: data.frequency,
        start_time: data.start_time + ':00',
        end_time: data.end_time + ':00',
        scheduled_time: data.start_time + ':00',
        days_of_week: data.days_of_week,
        is_active: data.is_active,
      };

      if (editingSchedule) {
        const { error } = await supabase
          .from('announcement_schedules')
          .update(payload)
          .eq('id', editingSchedule.id);

        if (error) throw error;
        toast.success('Agendamento atualizado!');
      } else {
        const { error } = await supabase
          .from('announcement_schedules')
          .insert(payload);

        if (error) throw error;
        toast.success('Agendamento criado!');
      }

      setDialogOpen(false);
      setEditingSchedule(null);
      fetchSchedules();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar agendamento');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) return;

    try {
      const { error } = await supabase
        .from('announcement_schedules')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Agendamento excluído!');
      fetchSchedules();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir agendamento');
    }
  };

  const toggleActive = async (schedule: AnnouncementSchedule) => {
    try {
      const { error } = await supabase
        .from('announcement_schedules')
        .update({ is_active: !schedule.is_active })
        .eq('id', schedule.id);

      if (error) throw error;
      fetchSchedules();
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar agendamento');
    }
  };

  const getDaysLabel = (days: number[]) => {
    if (days.length === 7) return 'Todos os dias';
    if (JSON.stringify(days.sort()) === JSON.stringify([1, 2, 3, 4, 5])) return 'Seg a Sex';
    if (JSON.stringify(days.sort()) === JSON.stringify([0, 6])) return 'Fim de semana';
    return days.map(d => daysOfWeek.find(dw => dw.value === d)?.label).join(', ');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Agendamentos</h3>
        <Button size="sm" onClick={() => { setEditingSchedule(null); setDialogOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Agendamento
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : schedules.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>Nenhum agendamento configurado</p>
          <p className="text-sm">Configure quando este aviso deve tocar automaticamente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className={cn(
                'flex items-center justify-between p-4 rounded-lg border transition-all',
                schedule.is_active 
                  ? 'bg-card border-border' 
                  : 'bg-muted/50 border-muted opacity-60'
              )}
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">
                    {schedule.start_time?.slice(0, 5)} - {schedule.end_time?.slice(0, 5)}
                  </span>
                </div>
                <Badge variant="secondary">
                  {getFrequencyLabel(schedule.frequency as AnnouncementFrequency)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {getDaysLabel(schedule.days_of_week || [])}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={schedule.is_active}
                  onCheckedChange={() => toggleActive(schedule)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setEditingSchedule(schedule); setDialogOpen(true); }}
                >
                  <Clock className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(schedule.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="glass-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingSchedule ? 'Editar Agendamento' : 'Novo Agendamento'}
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequência</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="15min">A cada 15 minutos</SelectItem>
                        <SelectItem value="30min">A cada 30 minutos</SelectItem>
                        <SelectItem value="1hour">A cada 1 hora</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Define com que frequência o aviso será reproduzido
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário Início</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário Término</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="days_of_week"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dias da Semana</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {daysOfWeek.map((day) => (
                        <Button
                          key={day.value}
                          type="button"
                          size="sm"
                          variant={field.value.includes(day.value) ? 'default' : 'outline'}
                          onClick={() => {
                            const current = field.value;
                            if (current.includes(day.value)) {
                              field.onChange(current.filter(d => d !== day.value));
                            } else {
                              field.onChange([...current, day.value]);
                            }
                          }}
                        >
                          {day.label}
                        </Button>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => field.onChange([0, 1, 2, 3, 4, 5, 6])}
                      >
                        Todos
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => field.onChange([1, 2, 3, 4, 5])}
                      >
                        Seg-Sex
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => field.onChange([0, 6])}
                      >
                        Fim de Semana
                      </Button>
                    </div>
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
                <Button type="submit" className="flex-1">
                  {editingSchedule ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
