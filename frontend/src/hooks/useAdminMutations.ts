import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createUserFriendlyError } from "@/lib/errorHandler";
import { USE_DJANGO_API } from "@/config/apiConfig";
import { api } from "@/lib/djangoApi";

// Profile mutations for admin
export interface AdminUpdateProfileData {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  weight?: number;
  bio?: string;
  is_pro_member?: boolean;
}

export function useAdminUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & AdminUpdateProfileData) => {
      if (USE_DJANGO_API.profiles) {
        return api.patch(`/profiles/${id}/`, data);
      }
      const { data: result, error } = await supabase
        .from("profiles")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw createUserFriendlyError(error);
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["profiles"] });
      queryClient.invalidateQueries({ queryKey: ["profiles", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["currentProfile"] });
    },
  });
}

// Championship mutations for admin
export interface AdminUpdateChampionshipData {
  name?: string;
  rules_summary?: string;
  is_private?: boolean;
  logo_url?: string;
  organizer_id?: string;
}

export function useAdminUpdateChampionship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & AdminUpdateChampionshipData) => {
      if (USE_DJANGO_API.championships) {
        return api.patch(`/championships/${id}/`, data);
      }
      const { data: result, error } = await supabase
        .from("championships")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw createUserFriendlyError(error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["championships"] });
    },
  });
}

export function useAdminDeleteChampionship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_DJANGO_API.championships) {
        return api.delete(`/championships/${id}/`);
      }
      const { error } = await supabase
        .from("championships")
        .delete()
        .eq("id", id);

      if (error) throw createUserFriendlyError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["championships"] });
    },
  });
}

// Event mutations for admin
export interface AdminUpdateEventData {
  name?: string;
  date?: string;
  track_id?: string | null;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  championship_id?: string;
}

export function useAdminUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & AdminUpdateEventData) => {
      if (USE_DJANGO_API.events) {
        return api.patch(`/events/${id}/`, data);
      }
      const { data: result, error } = await supabase
        .from("events")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw createUserFriendlyError(error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useAdminDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_DJANGO_API.events) {
        return api.delete(`/events/${id}/`);
      }
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", id);

      if (error) throw createUserFriendlyError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

// Heat mutations for admin
export interface AdminUpdateHeatData {
  name?: string;
  weather_condition?: 'dry' | 'wet' | 'mixed';
  start_time?: string | null;
  event_id?: string;
}

export function useAdminUpdateHeat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId, ...data }: { id: string; eventId: string } & AdminUpdateHeatData) => {
      if (USE_DJANGO_API.events) {
        const result = await api.patch(`/heats/${id}/`, data);
        return { result, eventId };
      }
      const { data: result, error } = await supabase
        .from("heats")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw createUserFriendlyError(error);
      return { result, eventId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["heats", data.eventId] });
    },
  });
}

export function useAdminDeleteHeat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      if (USE_DJANGO_API.events) {
        await api.delete(`/heats/${id}/`);
        return { eventId };
      }
      const { error } = await supabase
        .from("heats")
        .delete()
        .eq("id", id);

      if (error) throw createUserFriendlyError(error);
      return { eventId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["heats", data.eventId] });
    },
  });
}

// Heat Result mutations for admin
export interface AdminUpdateHeatResultData {
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
  payment_status?: boolean;
  points?: number;
}

export function useAdminUpdateHeatResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, heatId, ...data }: { id: string; heatId: string } & AdminUpdateHeatResultData) => {
      if (USE_DJANGO_API.events) {
        const result = await api.patch(`/heat-results/${id}/`, data);
        return { result, heatId };
      }
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

export function useAdminDeleteHeatResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, heatId }: { id: string; heatId: string }) => {
      if (USE_DJANGO_API.events) {
        await api.delete(`/heat-results/${id}/`);
        return { heatId };
      }
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

// Track mutations for admin (update)
export interface AdminUpdateTrackData {
  name?: string;
  location?: string;
  length_meters?: number | null;
  map_image_url?: string | null;
}

export function useAdminUpdateTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & AdminUpdateTrackData) => {
      if (USE_DJANGO_API.tracks) {
        return api.patch(`/tracks/${id}/`, data);
      }
      const { data: result, error } = await supabase
        .from("tracks")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw createUserFriendlyError(error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
    },
  });
}

// Bulk insert heat results for CSV import
export interface BulkHeatResultData {
  heat_id: string;
  position: number;
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

export function useAdminBulkInsertHeatResults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ heatId, results }: { heatId: string; results: BulkHeatResultData[] }) => {
      if (USE_DJANGO_API.events) {
        const data = await api.post(`/heats/${heatId}/results/bulk/`, results);
        return { data, heatId };
      }
      const { data, error } = await supabase
        .from("heat_results")
        .insert(results)
        .select();

      if (error) throw createUserFriendlyError(error);
      return { data, heatId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["heat_results", data.heatId] });
    },
  });
}
