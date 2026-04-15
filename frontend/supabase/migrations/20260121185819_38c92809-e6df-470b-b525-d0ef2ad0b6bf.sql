-- Drop existing tables (clean slate as requested)
DROP TABLE IF EXISTS public.lap_times CASCADE;
DROP TABLE IF EXISTS public.race_results CASCADE;
DROP TABLE IF EXISTS public.races CASCADE;
DROP TABLE IF EXISTS public.pilots CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;

-- Keep user_roles table as it's essential for auth

-- 1. PROFILES (Extension of auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    weight NUMERIC,
    bio TEXT,
    is_pro_member BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. TRACKS (Global tracks database)
CREATE TABLE public.tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    length_meters INTEGER,
    map_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tracks are viewable by everyone"
ON public.tracks FOR SELECT USING (true);

CREATE POLICY "Admins can manage tracks"
ON public.tracks FOR ALL USING (is_admin());

-- 3. CHAMPIONSHIPS
CREATE TABLE public.championships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    organizer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rules_summary TEXT,
    is_private BOOLEAN DEFAULT false,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.championships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public championships are viewable by everyone"
ON public.championships FOR SELECT USING (NOT is_private OR organizer_id = auth.uid());

CREATE POLICY "Organizers can manage own championships"
ON public.championships FOR ALL USING (organizer_id = auth.uid() OR is_admin());

-- 4. CHAMPIONSHIP_MEMBERS (Pivot table)
CREATE TYPE public.member_status AS ENUM ('active', 'pending', 'banned');
CREATE TYPE public.member_role AS ENUM ('driver', 'admin', 'organizer');

CREATE TABLE public.championship_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    championship_id UUID REFERENCES public.championships(id) ON DELETE CASCADE NOT NULL,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status member_status DEFAULT 'pending',
    role member_role DEFAULT 'driver',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(championship_id, profile_id)
);

ALTER TABLE public.championship_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members viewable by championship participants"
ON public.championship_members FOR SELECT USING (true);

CREATE POLICY "Users can join championships"
ON public.championship_members FOR INSERT WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Organizers can manage members"
ON public.championship_members FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.championships c 
        WHERE c.id = championship_id AND c.organizer_id = auth.uid()
    ) OR is_admin()
);

-- 5. EVENTS (Etapas)
CREATE TYPE public.event_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled');

CREATE TABLE public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    championship_id UUID REFERENCES public.championships(id) ON DELETE CASCADE NOT NULL,
    track_id UUID REFERENCES public.tracks(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    status event_status DEFAULT 'scheduled',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Events are viewable by everyone"
ON public.events FOR SELECT USING (true);

CREATE POLICY "Organizers can manage events"
ON public.events FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.championships c 
        WHERE c.id = championship_id AND c.organizer_id = auth.uid()
    ) OR is_admin()
);

-- 6. HEATS (Baterias)
CREATE TYPE public.weather_condition AS ENUM ('dry', 'wet', 'mixed');

CREATE TABLE public.heats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    weather_condition weather_condition DEFAULT 'dry',
    start_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.heats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Heats are viewable by everyone"
ON public.heats FOR SELECT USING (true);

CREATE POLICY "Organizers can manage heats"
ON public.heats FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.events e
        JOIN public.championships c ON c.id = e.championship_id
        WHERE e.id = event_id AND c.organizer_id = auth.uid()
    ) OR is_admin()
);

-- 7. HEAT_RESULTS (Core racing data)
CREATE TABLE public.heat_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    heat_id UUID REFERENCES public.heats(id) ON DELETE CASCADE NOT NULL,
    driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    driver_name_text TEXT,
    position INTEGER NOT NULL,
    kart_number INTEGER,
    best_lap_time TEXT,
    total_time TEXT,
    gap_to_leader TEXT,
    gap_to_previous TEXT,
    average_speed NUMERIC,
    total_laps INTEGER,
    payment_status BOOLEAN DEFAULT false,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.heat_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Results are viewable by everyone"
ON public.heat_results FOR SELECT USING (true);

CREATE POLICY "Organizers can manage results"
ON public.heat_results FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.heats h
        JOIN public.events e ON e.id = h.event_id
        JOIN public.championships c ON c.id = e.championship_id
        WHERE h.id = heat_id AND c.organizer_id = auth.uid()
    ) OR is_admin()
);

-- 8. LAP_TELEMETRY (Granular data for future)
CREATE TABLE public.lap_telemetry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    heat_result_id UUID REFERENCES public.heat_results(id) ON DELETE CASCADE NOT NULL,
    lap_number INTEGER NOT NULL,
    lap_time TEXT NOT NULL,
    sector1 TEXT,
    sector2 TEXT,
    sector3 TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.lap_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Telemetry is viewable by everyone"
ON public.lap_telemetry FOR SELECT USING (true);

CREATE POLICY "Organizers can manage telemetry"
ON public.lap_telemetry FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.heat_results hr
        JOIN public.heats h ON h.id = hr.heat_id
        JOIN public.events e ON e.id = h.event_id
        JOIN public.championships c ON c.id = e.championship_id
        WHERE hr.id = heat_result_id AND c.organizer_id = auth.uid()
    ) OR is_admin()
);

-- 9. DRIVER_BADGES (Gamification)
CREATE TABLE public.driver_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    badge_type TEXT NOT NULL,
    badge_name TEXT NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(profile_id, badge_type)
);

ALTER TABLE public.driver_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges are viewable by everyone"
ON public.driver_badges FOR SELECT USING (true);

CREATE POLICY "System can manage badges"
ON public.driver_badges FOR ALL USING (is_admin());

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to check if user is championship organizer
CREATE OR REPLACE FUNCTION public.is_championship_organizer(champ_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.championships
        WHERE id = champ_id AND organizer_id = auth.uid()
    )
$$;