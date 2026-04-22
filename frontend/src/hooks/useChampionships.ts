import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createUserFriendlyError } from "@/lib/errorHandler";
import { USE_DJANGO_API } from "@/config/apiConfig";
import { api } from "@/lib/djangoApi";
import type { Championship, ChampionshipMember } from "@/types/kart";

export function useChampionships() {
  return useQuery({
    queryKey: ["championships"],
    queryFn: async () => {
      if (USE_DJANGO_API.championships) {
        return api.get<Championship[]>("/championships/");
      }
      const { data, error } = await supabase
        .from("championships")
        .select(`
          *,
          organizer:profiles(id, username, full_name, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (error) throw createUserFriendlyError(error);
      return data as Championship[];
    },
  });
}

export function useChampionship(id: string | undefined) {
  return useQuery({
    queryKey: ["championships", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("championships")
        .select(`
          *,
          organizer:profiles(id, username, full_name, avatar_url)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw createUserFriendlyError(error);
      return data as Championship | null;
    },
    enabled: !!id,
  });
}

export function useChampionshipMembers(championshipId: string | undefined) {
  return useQuery({
    queryKey: ["championship_members", championshipId],
    queryFn: async () => {
      if (!championshipId) return [];
      
      // Note: weight is excluded from this query for security - it should only be
      // accessed via the can_view_profile_weight() RPC check in authorized contexts
      const { data, error } = await supabase
        .from("championship_members")
        .select(`
          *,
          profile:profiles(id, username, full_name, avatar_url)
        `)
        .eq("championship_id", championshipId)
        .order("joined_at");

      if (error) throw createUserFriendlyError(error);
      return data as ChampionshipMember[];
    },
    enabled: !!championshipId,
  });
}

export function useMyChampionships() {
  return useQuery({
    queryKey: ["myChampionships"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("championship_members")
        .select(`
          *,
          championship:championships(
            *,
            organizer:profiles(id, username, full_name, avatar_url)
          )
        `)
        .eq("profile_id", user.id)
        .eq("status", "active");

      if (error) throw createUserFriendlyError(error);
      return data;
    },
  });
}

export interface CreateChampionshipData {
  name: string;
  rules_summary?: string;
  is_private?: boolean;
  logo_url?: string;
}

export function useCreateChampionship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (championshipData: CreateChampionshipData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Você precisa estar logado para criar um campeonato.");

      const { data, error } = await supabase
        .from("championships")
        .insert({ ...championshipData, organizer_id: user.id })
        .select()
        .single();

      if (error) throw createUserFriendlyError(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["championships"] });
      queryClient.invalidateQueries({ queryKey: ["myChampionships"] });
    },
  });
}

export function useJoinChampionship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (championshipId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Você precisa estar logado para participar de um campeonato.");

      const { data, error } = await supabase
        .from("championship_members")
        .insert({
          championship_id: championshipId,
          profile_id: user.id,
          role: "driver",
          status: "pending",
        })
        .select()
        .single();

      if (error) throw createUserFriendlyError(error);
      return data;
    },
    onSuccess: (_, championshipId) => {
      queryClient.invalidateQueries({ queryKey: ["championship_members", championshipId] });
      queryClient.invalidateQueries({ queryKey: ["myChampionships"] });
    },
  });
}

export interface UpdateChampionshipData {
  id: string;
  name?: string;
  rules_summary?: string;
  is_private?: boolean;
  logo_url?: string;
}

export function useUpdateChampionship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateChampionshipData) => {
      const { data, error } = await supabase
        .from("championships")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw createUserFriendlyError(error);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["championships"] });
      queryClient.invalidateQueries({ queryKey: ["championships", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["myChampionships"] });
    },
  });
}

export function useDeleteChampionship() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("championships")
        .delete()
        .eq("id", id);

      if (error) throw createUserFriendlyError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["championships"] });
      queryClient.invalidateQueries({ queryKey: ["myChampionships"] });
    },
  });
}
