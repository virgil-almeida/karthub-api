import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createUserFriendlyError } from "@/lib/errorHandler";
import { toast } from "sonner";
import { USE_DJANGO_API } from "@/config/apiConfig";
import { api } from "@/lib/djangoApi";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string | null;
  icon_name: string;
  color: string;
  is_automatic: boolean;
  auto_condition: string | null;
  championship_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  show_preview: boolean;
  custom_image_url: string | null;
}

export function useBadgeDefinitions() {
  return useQuery({
    queryKey: ["badgeDefinitions"],
    queryFn: async () => {
      if (USE_DJANGO_API.badges) {
        return api.get<BadgeDefinition[]>("/badges/definitions/");
      }
      const { data, error } = await supabase
        .from("badge_definitions")
        .select("*")
        .order("name");
      if (error) throw createUserFriendlyError(error);
      return data as BadgeDefinition[];
    },
  });
}

export type BadgeDefinitionInput = {
  name: string;
  description?: string;
  icon_name: string;
  color?: string;
  is_automatic?: boolean;
  auto_condition?: string;
  championship_id?: string;
  show_preview?: boolean;
  custom_image_url?: string;
};

export function useCreateBadgeDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (badge: BadgeDefinitionInput) => {
      if (USE_DJANGO_API.badges) {
        return api.post<BadgeDefinition>("/badges/definitions/", badge);
      }
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("badge_definitions")
        .insert({ ...badge, created_by: user?.id })
        .select()
        .single();
      if (error) throw createUserFriendlyError(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badgeDefinitions"] });
      toast.success("Badge criado com sucesso");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateBadgeDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<BadgeDefinition> & { id: string }) => {
      if (USE_DJANGO_API.badges) {
        return api.patch<BadgeDefinition>(`/badges/definitions/${id}/`, data);
      }
      const { error } = await supabase
        .from("badge_definitions")
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw createUserFriendlyError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badgeDefinitions"] });
      toast.success("Badge atualizado");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useDeleteBadgeDefinition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (USE_DJANGO_API.badges) {
        return api.delete(`/badges/definitions/${id}/`);
      }
      const { error } = await supabase.from("badge_definitions").delete().eq("id", id);
      if (error) throw createUserFriendlyError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["badgeDefinitions"] });
      toast.success("Badge removido");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
