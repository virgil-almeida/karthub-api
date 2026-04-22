import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createUserFriendlyError } from "@/lib/errorHandler";
import { USE_DJANGO_API } from "@/config/apiConfig";
import { api } from "@/lib/djangoApi";
import type { Track } from "@/types/kart";

export function useTracks() {
  return useQuery({
    queryKey: ["tracks"],
    queryFn: async () => {
      if (USE_DJANGO_API.tracks) {
        return api.get<Track[]>("/tracks/");
      }
      const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .order("name");

      if (error) throw createUserFriendlyError(error);
      return data as Track[];
    },
  });
}

export function useTrack(id: string | undefined) {
  return useQuery({
    queryKey: ["tracks", id],
    queryFn: async () => {
      if (!id) return null;

      if (USE_DJANGO_API.tracks) {
        return api.get<Track>(`/tracks/${id}/`);
      }

      const { data, error } = await supabase
        .from("tracks")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw createUserFriendlyError(error);
      return data as Track | null;
    },
    enabled: !!id,
  });
}

export interface CreateTrackData {
  name: string;
  location: string;
  length_meters?: number;
  map_image_url?: string;
}

export function useCreateTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trackData: CreateTrackData) => {
      if (USE_DJANGO_API.tracks) {
        return api.post<Track>("/tracks/", trackData);
      }
      const { data, error } = await supabase
        .from("tracks")
        .insert(trackData)
        .select()
        .single();

      if (error) throw createUserFriendlyError(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
    },
  });
}

export function useDeleteTrack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trackId: string) => {
      if (USE_DJANGO_API.tracks) {
        return api.delete(`/tracks/${trackId}/`);
      }
      const { error } = await supabase
        .from("tracks")
        .delete()
        .eq("id", trackId);

      if (error) throw createUserFriendlyError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
    },
  });
}
