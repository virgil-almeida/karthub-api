import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, SubscriptionTier } from "@/contexts/AuthContext";
import { USE_DJANGO_API } from "@/config/apiConfig";
import { api } from "@/lib/djangoApi";

export interface FeatureVisibility {
  id: string;
  feature_key: string;
  min_tier: SubscriptionTier;
  label: string;
  created_at: string;
}

const TIER_ORDER: Record<SubscriptionTier, number> = {
  free: 1,
  user: 2,
  plus: 3,
  moderator: 4,
  admin: 5,
};

export function useFeatureVisibility() {
  return useQuery({
    queryKey: ["featureVisibility"],
    queryFn: async () => {
      if (USE_DJANGO_API.admin) {
        return api.get<FeatureVisibility[]>("/admin/feature-visibility/");
      }
      const { data, error } = await supabase
        .from("feature_visibility")
        .select("*")
        .order("label");

      if (error) throw error;
      return data as FeatureVisibility[];
    },
  });
}

export function useCanViewFeature(featureKey: string) {
  const { userTier } = useAuth();
  const { data: features } = useFeatureVisibility();

  if (!features) return true; // default allow while loading
  const feature = features.find((f) => f.feature_key === featureKey);
  if (!feature) return true;

  return TIER_ORDER[userTier] >= TIER_ORDER[feature.min_tier];
}

export function useUpdateFeatureVisibility() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, min_tier }: { id: string; min_tier: SubscriptionTier }) => {
      if (USE_DJANGO_API.admin) {
        return api.patch<FeatureVisibility>(`/admin/feature-visibility/${id}/`, { min_tier });
      }
      const { error } = await supabase
        .from("feature_visibility")
        .update({ min_tier })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["featureVisibility"] });
    },
  });
}
