-- Enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'pilot');

-- Tabela de equipes
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de pilotos (vinculada a auth.users)
CREATE TABLE public.pilots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  nickname TEXT NOT NULL,
  photo_url TEXT DEFAULT '',
  age INTEGER NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  nationality TEXT NOT NULL DEFAULT 'Brasil',
  team_id UUID REFERENCES public.teams(id),
  kart_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(kart_number)
);

-- Tabela de corridas
CREATE TABLE public.races (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  track TEXT NOT NULL,
  laps INTEGER NOT NULL,
  category TEXT NOT NULL DEFAULT 'Senior',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de resultados
CREATE TABLE public.race_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_id UUID REFERENCES public.races(id) ON DELETE CASCADE NOT NULL,
  pilot_id UUID REFERENCES public.pilots(id) ON DELETE CASCADE NOT NULL,
  position INTEGER NOT NULL,
  best_lap TEXT NOT NULL,
  total_laps INTEGER NOT NULL,
  total_time TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(race_id, pilot_id),
  UNIQUE(race_id, position)
);

-- Tabela de tempos de volta
CREATE TABLE public.lap_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  race_result_id UUID REFERENCES public.race_results(id) ON DELETE CASCADE NOT NULL,
  pilot_id UUID REFERENCES public.pilots(id) ON DELETE CASCADE NOT NULL,
  lap_number INTEGER NOT NULL,
  time TEXT NOT NULL,
  sector1 TEXT,
  sector2 TEXT,
  sector3 TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(race_result_id, lap_number)
);

-- Tabela de roles (separada conforme boas práticas)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- ===== FUNÇÕES HELPER DE SEGURANÇA =====

-- Verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

-- Verificar se usuário é dono do piloto
CREATE OR REPLACE FUNCTION public.is_pilot_owner(pilot_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.pilots
    WHERE id = pilot_id AND user_id = auth.uid()
  )
$$;

-- Obter pilot_id do usuário atual
CREATE OR REPLACE FUNCTION public.get_my_pilot_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.pilots WHERE user_id = auth.uid() LIMIT 1
$$;

-- ===== HABILITAR RLS =====

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pilots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.races ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.race_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lap_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ===== POLÍTICAS RLS =====

-- TEAMS: leitura pública, escrita só admin
CREATE POLICY "Teams are viewable by everyone" ON public.teams
  FOR SELECT USING (true);
CREATE POLICY "Admins can insert teams" ON public.teams
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update teams" ON public.teams
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete teams" ON public.teams
  FOR DELETE USING (public.is_admin());

-- PILOTS: leitura pública, edição próprio perfil ou admin
CREATE POLICY "Pilots are viewable by everyone" ON public.pilots
  FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.pilots
  FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admins can insert pilots" ON public.pilots
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can delete pilots" ON public.pilots
  FOR DELETE USING (public.is_admin());

-- RACES: leitura pública, escrita só admin
CREATE POLICY "Races are viewable by everyone" ON public.races
  FOR SELECT USING (true);
CREATE POLICY "Admins can insert races" ON public.races
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update races" ON public.races
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete races" ON public.races
  FOR DELETE USING (public.is_admin());

-- RACE_RESULTS: leitura pública, escrita só admin
CREATE POLICY "Results are viewable by everyone" ON public.race_results
  FOR SELECT USING (true);
CREATE POLICY "Admins can insert results" ON public.race_results
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update results" ON public.race_results
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete results" ON public.race_results
  FOR DELETE USING (public.is_admin());

-- LAP_TIMES: pilotos podem gerenciar seus próprios tempos
CREATE POLICY "Lap times viewable by everyone" ON public.lap_times
  FOR SELECT USING (true);
CREATE POLICY "Pilots can insert own lap times" ON public.lap_times
  FOR INSERT WITH CHECK (pilot_id = public.get_my_pilot_id() OR public.is_admin());
CREATE POLICY "Pilots can update own lap times" ON public.lap_times
  FOR UPDATE USING (pilot_id = public.get_my_pilot_id() OR public.is_admin());
CREATE POLICY "Pilots can delete own lap times" ON public.lap_times
  FOR DELETE USING (pilot_id = public.get_my_pilot_id() OR public.is_admin());

-- USER_ROLES: apenas admin pode ver/gerenciar (usuário pode ver própria role)
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT WITH CHECK (public.is_admin());
CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE USING (public.is_admin());
CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE USING (public.is_admin());