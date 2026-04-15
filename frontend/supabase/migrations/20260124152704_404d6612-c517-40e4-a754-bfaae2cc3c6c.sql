-- Add new columns to lap_telemetry for expanded driver telemetry
ALTER TABLE public.lap_telemetry 
ADD COLUMN IF NOT EXISTS kart_number INTEGER,
ADD COLUMN IF NOT EXISTS gap_to_best TEXT,
ADD COLUMN IF NOT EXISTS gap_to_leader TEXT,
ADD COLUMN IF NOT EXISTS total_time TEXT,
ADD COLUMN IF NOT EXISTS average_speed NUMERIC;

-- Add policy to allow drivers to manage their own telemetry
CREATE POLICY "Drivers can manage own telemetry"
ON public.lap_telemetry FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.heat_results hr
        WHERE hr.id = heat_result_id AND hr.driver_id = auth.uid()
    )
);