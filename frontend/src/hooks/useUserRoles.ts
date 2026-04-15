import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { createUserFriendlyError } from "@/lib/errorHandler";

export type SubscriptionTier = 'free' | 'user' | 'plus' | 'moderator' | 'admin';

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'pilot';
  tier: SubscriptionTier;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface UserWithRole {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role?: UserRole;
}

// Tier hierarchy for display and comparison
export const tierConfig: Record<SubscriptionTier, { label: string; color: string; priority: number }> = {
  free: { label: 'Free', color: 'bg-muted text-muted-foreground', priority: 1 },
  user: { label: 'User', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30', priority: 2 },
  plus: { label: 'Plus', color: 'bg-racing-green/20 text-racing-green border-racing-green/30', priority: 3 },
  moderator: { label: 'Moderador', color: 'bg-racing-orange/20 text-racing-orange border-racing-orange/30', priority: 4 },
  admin: { label: 'Admin', color: 'bg-racing-red/20 text-racing-red border-racing-red/30', priority: 5 },
};

// Get current user's tier
export function useCurrentUserTier() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["currentUserTier", user?.id],
    queryFn: async (): Promise<SubscriptionTier> => {
      const { data, error } = await supabase.rpc("get_user_tier");
      if (error) throw createUserFriendlyError(error);
      return (data as SubscriptionTier) || 'free';
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Check if current user can view analytics
export function useCanViewAnalytics() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["canViewAnalytics", user?.id],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc("can_view_analytics");
      if (error) return false;
      return data === true;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}

// Check if current user can create championships
export function useCanCreateChampionships() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["canCreateChampionships", user?.id],
    queryFn: async (): Promise<boolean> => {
      const { data, error } = await supabase.rpc("can_create_championships");
      if (error) return false;
      return data === true;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}

// Get all users with their roles (admin only)
export function useAllUsersWithRoles() {
  const { isAdmin } = useAuth();
  
  return useQuery({
    queryKey: ["allUsersWithRoles"],
    queryFn: async (): Promise<UserWithRole[]> => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, created_at")
        .order("created_at", { ascending: false });
      
      if (profilesError) throw createUserFriendlyError(profilesError);
      
      // Get all roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*");
      
      if (rolesError) throw createUserFriendlyError(rolesError);
      
      // Map roles to profiles
      return (profiles || []).map(profile => ({
        ...profile,
        role: roles?.find(r => r.user_id === profile.id) as UserRole | undefined,
      }));
    },
    enabled: isAdmin,
  });
}

// Update user tier
export function useUpdateUserTier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      tier, 
      expiresAt 
    }: { 
      userId: string; 
      tier: SubscriptionTier; 
      expiresAt?: Date | null;
    }) => {
      // Check if user already has a role entry
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", userId)
        .single();
      
      const updateData = {
        tier,
        expires_at: expiresAt?.toISOString() || null,
        updated_at: new Date().toISOString(),
      };
      
      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from("user_roles")
          .update(updateData)
          .eq("id", existingRole.id);
        
        if (error) throw createUserFriendlyError(error);
      } else {
        // Insert new role
        const { error } = await supabase
          .from("user_roles")
          .insert({
            user_id: userId,
            role: 'pilot',
            ...updateData,
          });
        
        if (error) throw createUserFriendlyError(error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsersWithRoles"] });
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
      queryClient.invalidateQueries({ queryKey: ["currentUserTier"] });
    },
  });
}

// Delete user role (reset to free)
export function useResetUserTier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ 
          tier: 'free', 
          expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId);
      
      if (error) throw createUserFriendlyError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allUsersWithRoles"] });
      queryClient.invalidateQueries({ queryKey: ["user-roles"] });
    },
  });
}

// Calculate days remaining for expiring tier
export function getDaysRemaining(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const now = new Date();
  const expiry = new Date(expiresAt);
  const diff = expiry.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// Check if tier is expired
export function isTierExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}
