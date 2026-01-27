-- Corrigir função com search_path mutável
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Remover políticas permissivas demais e recriar com restrições adequadas
DROP POLICY IF EXISTS "Authenticated users can insert playback_logs" ON public.playback_logs;
DROP POLICY IF EXISTS "Authenticated users can manage player_sessions" ON public.player_sessions;

-- Playback logs - usuários só podem inserir logs de lojas ativas
CREATE POLICY "Authenticated users can insert playback_logs" ON public.playback_logs 
FOR INSERT TO authenticated 
WITH CHECK (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND status = 'active')
);

-- Player sessions - restringir a admins e managers
CREATE POLICY "Admins and managers can manage player_sessions" ON public.player_sessions 
FOR ALL TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'manager')
);

-- Adicionar política para operadores poderem atualizar suas sessões
CREATE POLICY "Operators can update their store sessions" ON public.player_sessions 
FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.stores WHERE id = store_id AND status = 'active')
);