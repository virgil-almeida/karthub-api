import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUpdateProfile } from "@/hooks/useProfiles";

export function useAvatarUpload() {
  const [uploading, setUploading] = useState(false);
  const updateProfile = useUpdateProfile();

  const uploadAvatar = async (userId: string, file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${userId}/avatar.${fileExt}`;

      // Remove old avatar files first
      const { data: existingFiles } = await supabase.storage
        .from("avatars")
        .list(userId);

      if (existingFiles?.length) {
        await supabase.storage
          .from("avatars")
          .remove(existingFiles.map((f) => `${userId}/${f.name}`));
      }

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await updateProfile.mutateAsync({
        id: userId,
        avatar_url: avatarUrl,
      });

      return avatarUrl;
    } catch (error) {
      console.error("Avatar upload error:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return { uploadAvatar, uploading };
}
