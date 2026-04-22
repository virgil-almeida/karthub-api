import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createUserFriendlyError } from "@/lib/errorHandler";
import { toast } from "sonner";
import { USE_DJANGO_API } from "@/config/apiConfig";
import { api } from "@/lib/djangoApi";

export interface AssignedBadge {
  id: string;
  profile_id: string;
  badge_type: string;
  badge_name: string;
  badge_definition_id: string | null;
  championship_id: string | null;
  awarded_by: string | null;
  notes: string | null;
  earned_at: string;
}

export function useAssignedBadges() {
  return useQuery({
    queryKey: ["assignedBadges"],
    queryFn: async () => {
      if (USE_DJANGO_API.badges) {
        return api.get<AssignedBadge[]>("/badges/assigned/");
      }
      const { data, error } = await supabase
        .from("driver_badges")
        .select("*")
        .order("earned_at", { ascending: false })
        .limit(50);
      if (error) throw createUserFriendlyError(error);
      return data as AssignedBadge[];
    },
  });
}

export type AssignBadgeParams = {
  profile_id: string;
  badge_definition_id?: string;
  badge_name: string;
  badge_type: string;
  championship_id?: string;
  notes?: string;
};

export function useAssignBadge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: AssignBadgeParams) => {
      if (USE_DJANGO_API.badges) {
        return api.post<AssignedBadge>("/badges/assigned/", params);
      }
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("driver_badges")
        .insert({
          profile_id: params.profile_id,
          badge_definition_id: params.badge_definition_id,
          badge_name: params.badge_name,
          badge_type: params.badge_type,
          championship_id: params.championship_id || null,
          awarded_by: user?.id,
          notes: params.notes || null,
        })
        .select()
        .single();
      if (error) throw createUserFriendlyError(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignedBadges"] });
      queryClient.invalidateQueries({ queryKey: ["driverBadges"] });
      toast.success("Badge atribuído com sucesso");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useRemoveBadge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_DJANGO_API.badges) {
        return api.delete(`/badges/assigned/${id}/`);
      }
      const { error } = await supabase.from("driver_badges").delete().eq("id", id);
      if (error) throw createUserFriendlyError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignedBadges"] });
      queryClient.invalidateQueries({ queryKey: ["driverBadges"] });
      toast.success("Badge removido do piloto");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
