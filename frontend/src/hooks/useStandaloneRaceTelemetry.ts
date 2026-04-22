import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { USE_DJANGO_API } from "@/config/apiConfig";
import { api } from "@/lib/djangoApi";

export interface StandaloneRaceTelemetryRow {
  id: string;
  standalone_race_id: string;
  lap_number: number;
  lap_time: string;
  kart_number: number | null;
  gap_to_best: string | null;
  gap_to_leader: string | null;
  total_time: string | null;
  average_speed: number | null;
  sector1: string | null;
  sector2: string | null;
  sector3: string | null;
  created_at: string | null;
}

export function useStandaloneRaceTelemetry(raceId: string | undefined) {
  return useQuery({
    queryKey: ["standalone-race-telemetry", raceId],
    queryFn: async () => {
      if (USE_DJANGO_API.races) {
        return api.get<StandaloneRaceTelemetryRow[]>(`/races/${raceId}/telemetry/`);
      }
      const { data, error } = await supabase
        .from("standalone_race_telemetry" as any)
        .select("*")
        .eq("standalone_race_id", raceId!)
        .order("lap_number", { ascending: true });
      if (error) throw error;
      return data as unknown as StandaloneRaceTelemetryRow[];
    },
    enabled: !!raceId,
  });
}

export function useCreateStandaloneRaceTelemetry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Omit<StandaloneRaceTelemetryRow, "id" | "created_at">) => {
      if (USE_DJANGO_API.races) {
        return api.post<StandaloneRaceTelemetryRow>(
          `/races/${entry.standalone_race_id}/telemetry/`,
          entry,
        );
      }
      const { data, error } = await supabase
        .from("standalone_race_telemetry" as any)
        .insert(entry as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["standalone-race-telemetry", variables.standalone_race_id] });
    },
  });
}

export function useUpdateStandaloneRaceTelemetry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, raceId, ...updates }: { id: string; raceId: string } & Partial<StandaloneRaceTelemetryRow>) => {
      if (USE_DJANGO_API.races) {
        return api.patch<StandaloneRaceTelemetryRow>(`/races/telemetry/${id}/`, updates);
      }
      const { data, error } = await supabase
        .from("standalone_race_telemetry" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["standalone-race-telemetry", variables.raceId] });
    },
  });
}

export function useDeleteStandaloneRaceTelemetry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, raceId }: { id: string; raceId: string }) => {
      if (USE_DJANGO_API.races) {
        return api.delete(`/races/telemetry/${id}/`);
      }
      const { error } = await supabase
        .from("standalone_race_telemetry" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["standalone-race-telemetry", variables.raceId] });
    },
  });
}
