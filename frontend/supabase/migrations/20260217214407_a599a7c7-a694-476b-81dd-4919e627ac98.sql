CREATE TABLE public.standalone_race_telemetry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  standalone_race_id uuid NOT NULL REFERENCES standalone_races(id) ON DELETE CASCADE,
  lap_number integer NOT NULL,
  lap_time text NOT NULL,
  kart_number integer,
  gap_to_best text,
  gap_to_leader text,
  total_time text,
  average_speed numeric,
  sector1 text,
  sector2 text,
  sector3 text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE standalone_race_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own standalone race telemetry"
  ON standalone_race_telemetry FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM standalone_races sr
      WHERE sr.id = standalone_race_telemetry.standalone_race_id
      AND sr.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM standalone_races sr
      WHERE sr.id = standalone_race_telemetry.standalone_race_id
      AND sr.user_id = auth.uid()
    )
  );