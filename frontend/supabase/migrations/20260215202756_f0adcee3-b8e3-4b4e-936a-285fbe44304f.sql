
-- Create standalone_races table for training/free races
CREATE TABLE public.standalone_races (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  race_type TEXT NOT NULL DEFAULT 'training' CHECK (race_type IN ('training', 'standalone')),
  track_name TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  position INTEGER,
  kart_number INTEGER,
  total_laps INTEGER,
  best_lap_time TEXT,
  total_time TEXT,
  average_speed NUMERIC,
  gap_to_leader TEXT,
  points INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.standalone_races ENABLE ROW LEVEL SECURITY;

-- Users can manage their own standalone races
CREATE POLICY "Users can manage own standalone races"
ON public.standalone_races FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
