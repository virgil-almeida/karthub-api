import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createUserFriendlyError } from "@/lib/errorHandler";
import { USE_DJANGO_API } from "@/config/apiConfig";
import { api } from "@/lib/djangoApi";
import type { Profile } from "@/types/kart";

// Public profile type (without sensitive fields for unauthorized users)
export interface PublicProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_pro_member: boolean;
  instagram: string | null;
  youtube: string | null;
  tiktok: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
  weight?: number | null;
}

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      if (USE_DJANGO_API.profiles) {
        return api.get<PublicProfile[]>("/profiles/");
      }
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, bio, is_pro_member, instagram, youtube, tiktok, website, created_at, updated_at")
        .order("full_name");

      if (error) throw createUserFriendlyError(error);
      return data as PublicProfile[];
    },
  });
}

export function useProfile(id: string | undefined) {
  return useQuery({
    queryKey: ["profiles", id],
    queryFn: async () => {
      if (!id) return null;

      if (USE_DJANGO_API.profiles) {
        return api.get<Profile>(`/profiles/${id}/`);
      }

      // First get the basic profile data
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, bio, is_pro_member, instagram, youtube, tiktok, website, created_at, updated_at")
        .eq("id", id)
        .maybeSingle();

      if (error) throw createUserFriendlyError(error);
      if (!data) return null;

      // Check if current user can view weight
      // Using type assertion as the function was just created and types haven't regenerated yet
      const { data: canViewWeight } = await supabase
        .rpc("can_view_profile_weight" as any, { target_profile_id: id });

      // If authorized, fetch weight separately
      let weight: number | null = null;
      if (canViewWeight) {
        const { data: fullProfile } = await supabase
          .from("profiles")
          .select("weight")
          .eq("id", id)
          .maybeSingle();
        weight = fullProfile?.weight ?? null;
      }

      return { ...data, weight } as Profile;
    },
    enabled: !!id,
  });
}

export function useCurrentProfile() {
  return useQuery({
    queryKey: ["currentProfile"],
    queryFn: async () => {
      if (USE_DJANGO_API.profiles) {
        // Django: get user id from /auth/me/ then fetch profile
        const me = await api.get<{ id: string }>("/auth/me/");
        return api.get<Profile>(`/profiles/${me.id}/`);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Current user can always see their own full profile including weight
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) throw createUserFriendlyError(error);
      return data as Profile | null;
    },
  });
}

export interface UpdateProfileData {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  weight?: number;
  bio?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
  website?: string;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string } & UpdateProfileData) => {
      if (USE_DJANGO_API.profiles) {
        return api.patch<Profile>(`/profiles/${id}/`, data);
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
