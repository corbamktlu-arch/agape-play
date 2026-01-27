-- Enum para tipos de aviso
CREATE TYPE public.announcement_target AS ENUM ('individual', 'group', 'global');

-- Enum para períodos do dia
CREATE TYPE public.day_period AS ENUM ('morning', 'afternoon', 'night');

-- Enum para status de loja
CREATE TYPE public.store_status AS ENUM ('active', 'inactive');

-- Enum para roles de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'manager', 'operator');

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de roles de usuário
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'operator',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, role)
);

-- Tabela de lojas
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  status store_status DEFAULT 'active' NOT NULL,
  default_volume INTEGER DEFAULT 70 CHECK (default_volume >= 0 AND default_volume <= 100),
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de playlists
CREATE TABLE public.playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_global BOOLEAN DEFAULT false NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  period day_period,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Tabela de músicas
CREATE TABLE public.tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT,
  duration_seconds INTEGER,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  genre TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Relacionamento playlist-músicas
CREATE TABLE public.playlist_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL,
  last_played_at TIMESTAMP WITH TIME ZONE,
  play_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (playlist_id, track_id)
);

-- Tabela de avisos
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  duration_seconds INTEGER,
  target_type announcement_target NOT NULL,
  priority INTEGER DEFAULT 1 CHECK (priority >= 1 AND priority <= 5),
  category TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Relacionamento avisos-lojas (para avisos individuais e em grupo)
CREATE TABLE public.announcement_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (announcement_id, store_id)
);

-- Agendamento de avisos
CREATE TABLE public.announcement_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE NOT NULL,
  scheduled_time TIME NOT NULL,
  days_of_week INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6],
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Programação de rádio por loja
CREATE TABLE public.store_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE SET NULL,
  period day_period NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  use_global BOOLEAN DEFAULT false NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (store_id, period)
);

-- Log de reprodução (para evitar repetição)
CREATE TABLE public.playback_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  track_id UUID REFERENCES public.tracks(id) ON DELETE CASCADE,
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('track', 'announcement'))
);

-- Sessões ativas dos players
CREATE TABLE public.player_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_volume INTEGER DEFAULT 70,
  is_playing BOOLEAN DEFAULT true,
  current_track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL,
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Função para verificar role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_playlists_updated_at BEFORE UPDATE ON public.playlists FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playback_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Políticas RLS para user_roles (apenas admins podem gerenciar)
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para stores (autenticados podem ver, admins podem gerenciar)
CREATE POLICY "Authenticated users can view stores" ON public.stores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage stores" ON public.stores FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para playlists
CREATE POLICY "Authenticated users can view playlists" ON public.playlists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage playlists" ON public.playlists FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para tracks
CREATE POLICY "Authenticated users can view tracks" ON public.tracks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage tracks" ON public.tracks FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para playlist_tracks
CREATE POLICY "Authenticated users can view playlist_tracks" ON public.playlist_tracks FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage playlist_tracks" ON public.playlist_tracks FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para announcements
CREATE POLICY "Authenticated users can view announcements" ON public.announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para announcement_stores
CREATE POLICY "Authenticated users can view announcement_stores" ON public.announcement_stores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage announcement_stores" ON public.announcement_stores FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para announcement_schedules
CREATE POLICY "Authenticated users can view schedules" ON public.announcement_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage schedules" ON public.announcement_schedules FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para store_schedules
CREATE POLICY "Authenticated users can view store_schedules" ON public.store_schedules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage store_schedules" ON public.store_schedules FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Políticas RLS para playback_logs
CREATE POLICY "Authenticated users can view playback_logs" ON public.playback_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert playback_logs" ON public.playback_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Políticas RLS para player_sessions
CREATE POLICY "Authenticated users can view player_sessions" ON public.player_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage player_sessions" ON public.player_sessions FOR ALL TO authenticated USING (true);

-- Habilitar realtime para player_sessions e announcements
ALTER PUBLICATION supabase_realtime ADD TABLE public.player_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;

-- Inserir lojas iniciais
INSERT INTO public.stores (name, code, status, default_volume, address) VALUES
('Loja Centro', 'LOJA001', 'active', 75, 'Rua Principal, 100 - Centro'),
('Loja Shopping', 'LOJA002', 'active', 70, 'Shopping Center, Loja 45'),
('Loja Bairro', 'LOJA003', 'active', 80, 'Av. das Flores, 500 - Bairro Novo');

-- Criar bucket para áudios
INSERT INTO storage.buckets (id, name, public) VALUES ('audio-files', 'audio-files', true);

-- Políticas de storage para áudios
CREATE POLICY "Public can view audio files" ON storage.objects FOR SELECT USING (bucket_id = 'audio-files');
CREATE POLICY "Authenticated users can upload audio" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'audio-files');
CREATE POLICY "Authenticated users can update audio" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'audio-files');
CREATE POLICY "Authenticated users can delete audio" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'audio-files');