import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createUserFriendlyError } from "@/lib/errorHandler";
import type { MemberStatus } from "@/types/kart";

export function useUpdateMemberStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      memberId, 
      championshipId, 
      status 
    }: { 
      memberId: string; 
      championshipId: string; 
      status: MemberStatus;
    }) => {
      const { data, error } = await supabase
        .from("championship_members")
        .update({ status })
        .eq("id", memberId)
        .select()
        .single();

      if (error) throw createUserFriendlyError(error);
      return { data, championshipId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["championship_members", result.championshipId] });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      memberId, 
      championshipId 
    }: { 
      memberId: string; 
      championshipId: string;
    }) => {
      const { error } = await supabase
        .from("championship_members")
        .delete()
        .eq("id", memberId);

      if (error) throw createUserFriendlyError(error);
      return { championshipId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["championship_members", result.championshipId] });
    },
  });
}
