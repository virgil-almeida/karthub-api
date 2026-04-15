import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface StandaloneRace {
  id: string;
  user_id: string;
  race_type: "training" | "standalone";
  track_name: string | null;
  date: string;
  position: number | null;
  kart_number: number | null;
  total_laps: number | null;
  best_lap_time: string | null;
  total_time: string | null;
  average_speed: number | null;
  gap_to_leader: string | null;
  points: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type StandaloneRaceInsert = Omit<StandaloneRace, "id" | "created_at" | "updated_at">;

export function useStandaloneRaces() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["standaloneRaces", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("standalone_races")
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as StandaloneRace[];
    },
    enabled: !!user?.id,
  });
}

export function useCreateStandaloneRace() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (race: Omit<StandaloneRaceInsert, "user_id">) => {
      const { data, error } = await supabase
        .from("standalone_races")
        .insert({ ...race, user_id: user!.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["standaloneRaces"] });
      queryClient.invalidateQueries({ queryKey: ["driverStats"] });
      queryClient.invalidateQueries({ queryKey: ["careerChart"] });
      toast.success("Corrida avulsa registrada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao registrar corrida avulsa");
    },
  });
}

export function useDeleteStandaloneRace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (raceId: string) => {
      const { error } = await supabase
        .from("standalone_races")
        .delete()
        .eq("id", raceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["standaloneRaces"] });
      queryClient.invalidateQueries({ queryKey: ["driverStats"] });
      queryClient.invalidateQueries({ queryKey: ["careerChart"] });
      toast.success("Corrida removida!");
    },
    onError: () => {
      toast.error("Erro ao remover corrida");
    },
  });
}
