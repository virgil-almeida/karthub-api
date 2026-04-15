import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createUserFriendlyError } from "@/lib/errorHandler";

// Create heat result for organizers
export interface CreateOrganizerHeatResultData {
  heat_id: string;
  position: number;
  driver_id?: string | null;
  driver_name_text?: string | null;
  kart_number?: number | null;
  best_lap_time?: string | null;
  total_time?: string | null;
  gap_to_leader?: string | null;
  gap_to_previous?: string | null;
  average_speed?: number | null;
  total_laps?: number | null;
  points?: number;
}

export function useCreateOrganizerHeatResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrganizerHeatResultData) => {
      const { data: result, error } = await supabase
        .from("heat_results")
        .insert(data)
        .select()
        .single();

      if (error) throw createUserFriendlyError(error);
      return { result, heatId: data.heat_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["heat_results", data.heatId] });
    },
  });
}

// Update heat result for organizers
export interface UpdateOrganizerHeatResultData {
  id: string;
  heatId: string;
  position?: number;
  driver_id?: string | null;
  driver_name_text?: string | null;
  kart_number?: number | null;
  best_lap_time?: string | null;
  total_time?: string | null;
  gap_to_leader?: string | null;
  gap_to_previous?: string | null;
  average_speed?: number | null;
  total_laps?: number | null;
  points?: number;
}

export function useUpdateOrganizerHeatResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, heatId, ...data }: UpdateOrganizerHeatResultData) => {
      const { data: result, error } = await supabase
        .from("heat_results")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw createUserFriendlyError(error);
      return { result, heatId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["heat_results", data.heatId] });
    },
  });
}

// Delete heat result for organizers
export function useDeleteOrganizerHeatResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, heatId }: { id: string; heatId: string }) => {
      const { error } = await supabase
        .from("heat_results")
        .delete()
        .eq("id", id);

      if (error) throw createUserFriendlyError(error);
      return { heatId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["heat_results", data.heatId] });
    },
  });
}

// Create heat for organizers
export interface CreateOrganizerHeatData {
  event_id: string;
  name: string;
  weather_condition?: "dry" | "wet" | "mixed";
  start_time?: string | null;
}

export function useCreateOrganizerHeat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateOrganizerHeatData) => {
      const { data: result, error } = await supabase
        .from("heats")
        .insert(data)
        .select()
        .single();

      if (error) throw createUserFriendlyError(error);
      return { result, eventId: data.event_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["heats", data.eventId] });
    },
  });
}

// Create lap telemetry for drivers
export interface CreateLapTelemetryData {
  heat_result_id: string;
  lap_number: number;
  lap_time: string;
  sector1?: string | null;
  sector2?: string | null;
  sector3?: string | null;
  kart_number?: number | null;
  gap_to_best?: string | null;
  gap_to_leader?: string | null;
  total_time?: string | null;
  average_speed?: number | null;
}

export function useCreateLapTelemetry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLapTelemetryData) => {
      const { data: result, error } = await supabase
        .from("lap_telemetry")
        .insert(data)
        .select()
        .single();

      if (error) throw createUserFriendlyError(error);
      return { result, heatResultId: data.heat_result_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["lap_telemetry", data.heatResultId] });
    },
  });
}

// Update lap telemetry
export function useUpdateLapTelemetry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, heatResultId, ...data }: { 
      id: string; 
      heatResultId: string; 
      lap_number?: number;
      lap_time?: string; 
      sector1?: string | null; 
      sector2?: string | null; 
      sector3?: string | null;
      kart_number?: number | null;
      gap_to_best?: string | null;
      gap_to_leader?: string | null;
      total_time?: string | null;
      average_speed?: number | null;
    }) => {
      const { data: result, error } = await supabase
        .from("lap_telemetry")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw createUserFriendlyError(error);
      return { result, heatResultId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["lap_telemetry", data.heatResultId] });
    },
  });
}

// Delete lap telemetry
export function useDeleteLapTelemetry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, heatResultId }: { id: string; heatResultId: string }) => {
      const { error } = await supabase
        .from("lap_telemetry")
        .delete()
        .eq("id", id);

      if (error) throw createUserFriendlyError(error);
      return { heatResultId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["lap_telemetry", data.heatResultId] });
    },
  });
}
