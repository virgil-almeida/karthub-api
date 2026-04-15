import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createUserFriendlyError } from "@/lib/errorHandler";
import { toast } from "sonner";

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

export function useAssignBadge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      profile_id: string;
      badge_definition_id: string;
      badge_name: string;
      badge_type: string;
      championship_id?: string;
      notes?: string;
    }) => {
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
