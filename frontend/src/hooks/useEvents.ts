import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createUserFriendlyError } from "@/lib/errorHandler";
import type { Event, Heat, HeatResult, LapTelemetry } from "@/types/kart";

export function useEvents(championshipId?: string) {
  return useQuery({
    queryKey: ["events", championshipId],
    queryFn: async () => {
      let query = supabase
        .from("events")
        .select(`
          *,
          track:tracks(id, name, location, length_meters),
          championship:championships(id, name)
        `)
        .order("date", { ascending: false });

      if (championshipId) {
        query = query.eq("championship_id", championshipId);
      }

      const { data, error } = await query;
      if (error) throw createUserFriendlyError(error);
      return data as Event[];
    },
  });
}

export function useEvent(id: string | undefined) {
  return useQuery({
    queryKey: ["events", "detail", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("events")
        .select(`
          *,
          track:tracks(id, name, location, length_meters, map_image_url),
          championship:championships(id, name, organizer_id)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw createUserFriendlyError(error);
      return data as Event | null;
    },
    enabled: !!id,
  });
}

export function useHeats(eventId: string | undefined) {
  return useQuery({
    queryKey: ["heats", eventId],
    queryFn: async () => {
      if (!eventId) return [];
      
      const { data, error } = await supabase
        .from("heats")
        .select("*")
        .eq("event_id", eventId)
        .order("start_time");

      if (error) throw createUserFriendlyError(error);
      return data as Heat[];
    },
    enabled: !!eventId,
  });
}

export function useHeatResults(heatId: string | undefined) {
  return useQuery({
    queryKey: ["heat_results", heatId],
    queryFn: async () => {
      if (!heatId) return [];
      
      const { data, error } = await supabase
        .from("heat_results_public")
        .select(`
          *,
          driver:profiles(id, username, full_name, avatar_url)
        `)
        .eq("heat_id", heatId)
        .order("position");

      if (error) throw createUserFriendlyError(error);
      return data as HeatResult[];
    },
    enabled: !!heatId,
  });
}

export function useLapTelemetry(heatResultId: string | undefined) {
  return useQuery({
    queryKey: ["lap_telemetry", heatResultId],
    queryFn: async () => {
      if (!heatResultId) return [];
      
      const { data, error } = await supabase
        .from("lap_telemetry")
        .select("*")
        .eq("heat_result_id", heatResultId)
        .order("lap_number");

      if (error) throw createUserFriendlyError(error);
      return data as LapTelemetry[];
    },
    enabled: !!heatResultId,
  });
}

export interface CreateEventData {
  championship_id: string;
  track_id?: string;
  name: string;
  date: string;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventData: CreateEventData) => {
      const { data, error } = await supabase
        .from("events")
        .insert(eventData)
        .select()
        .single();

      if (error) throw createUserFriendlyError(error);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["events", variables.championship_id] });
    },
  });
}

export interface CreateHeatData {
  event_id: string;
  name: string;
  weather_condition?: 'dry' | 'wet' | 'mixed';
  start_time?: string;
}

export function useCreateHeat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (heatData: CreateHeatData) => {
      const { data, error } = await supabase
        .from("heats")
        .insert(heatData)
        .select()
        .single();

      if (error) throw createUserFriendlyError(error);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["heats", variables.event_id] });
    },
  });
}

export interface CreateHeatResultData {
  heat_id: string;
  driver_id?: string;
  driver_name_text?: string;
  position: number;
  kart_number?: number;
  best_lap_time?: string;
  total_time?: string;
  gap_to_leader?: string;
  gap_to_previous?: string;
  average_speed?: number;
  total_laps?: number;
  payment_status?: boolean;
  points?: number;
}

export function useCreateHeatResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (resultData: CreateHeatResultData) => {
      const { data, error } = await supabase
        .from("heat_results")
        .insert(resultData)
        .select()
        .single();

      if (error) throw createUserFriendlyError(error);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["heat_results", variables.heat_id] });
    },
  });
}

export function useUpdatePaymentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payment_status, heat_id }: { id: string; payment_status: boolean; heat_id: string }) => {
      const { data, error } = await supabase
        .from("heat_results")
        .update({ payment_status })
        .eq("id", id)
        .select()
        .single();

      if (error) throw createUserFriendlyError(error);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["heat_results", variables.heat_id] });
    },
  });
}
