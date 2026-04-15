import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentProfile, useUpdateProfile } from "@/hooks/useProfiles";
import { useAvatarUpload } from "@/hooks/useAvatarUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Settings, User, Camera, Instagram, Youtube, Globe, Lock } from "lucide-react";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { useCanViewFeature } from "@/hooks/useFeatureVisibility";

export function ProfileEditDialog() {
  const { t } = useTranslation();
  const { user, userTier } = useAuth();
  const { data: profile, isLoading } = useCurrentProfile();
  const updateProfile = useUpdateProfile();
  const { uploadAvatar, uploading } = useAvatarUpload();
  const canShowWebsite = useCanViewFeature("profile_website");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: "", username: "", weight: "", bio: "",
    instagram: "", youtube: "", tiktok: "", website: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const profileSchema = z.object({
    full_name: z.string().trim().min(2, t("auth.nameMinLength")).max(100, t("auth.nameTooLong")),
    username: z.string().trim().min(3, t("auth.usernameMinLength")).max(30, t("auth.usernameTooLong")).regex(/^[a-zA-Z0-9_]+$/, t("auth.usernamePattern")).optional().or(z.literal("")),
    weight: z.number().min(30, t("auth.weightMin")).max(200, t("auth.weightMax")).optional().or(z.nan()),
    bio: z.string().trim().max(500, t("auth.bioTooLong")).optional().or(z.literal("")),
    instagram: z.string().trim().max(100).optional().or(z.literal("")),
    youtube: z.string().trim().max(200).optional().or(z.literal("")),
    tiktok: z.string().trim().max(100).optional().or(z.literal("")),
    website: z.string().trim().max(200).optional().or(z.literal("")),
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        username: profile.username || "",
        weight: profile.weight?.toString() || "",
        bio: profile.bio || "",
        instagram: profile.instagram || "",
        youtube: profile.youtube || "",
        tiktok: profile.tiktok || "",
        website: profile.website || "",
      });
      setAvatarPreview(profile.avatar_url || null);
    }
  }, [profile]);

  if (!user) return null;

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("profile.avatarTooLarge"));
      return;
    }
    try {
      const url = await uploadAvatar(user.id, file);
      if (url) setAvatarPreview(url);
      toast.success(t("profile.avatarUpdated"));
    } catch {
      toast.error(t("profile.avatarUploadError"));
    }
  };

  const validateForm = () => {
    const data = {
      full_name: formData.full_name,
      username: formData.username || undefined,
      weight: formData.weight ? parseFloat(formData.weight) : undefined,
      bio: formData.bio || undefined,
      instagram: formData.instagram || undefined,
      youtube: formData.youtube || undefined,
      tiktok: formData.tiktok || undefined,
      website: canShowWebsite ? (formData.website || undefined) : undefined,
    };
    const result = profileSchema.safeParse(data);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) newErrors[err.path[0].toString()] = err.message;
      });
      setErrors(newErrors);
      return null;
    }
    setErrors({});
    return result.data;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validData = validateForm();
    if (!validData) return;
    try {
      await updateProfile.mutateAsync({
        id: user.id,
        full_name: validData.full_name,
        username: validData.username || undefined,
        weight: validData.weight && !isNaN(validData.weight) ? validData.weight : undefined,
        bio: validData.bio || undefined,
        instagram: validData.instagram || undefined,
        youtube: validData.youtube || undefined,
        tiktok: validData.tiktok || undefined,
        website: canShowWebsite ? (validData.website || undefined) : undefined,
      });
      toast.success(t("profile.profileUpdated"));
      setOpen(false);
    } catch {
      toast.error(t("profile.profileUpdateError"));
    }
  };

  const hasProfile = profile?.full_name;
  const isPro = userTier === "plus" || userTier === "moderator" || userTier === "admin";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={hasProfile ? "outline" : "default"} size="sm" className={!hasProfile ? "animate-pulse" : ""}>
          {hasProfile ? (
            <><Settings className="w-4 h-4 mr-2" />{t("profile.editProfile")}</>
          ) : (
            <><User className="w-4 h-4 mr-2" />{t("profile.completeRegistration")}</>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-racing">
            {hasProfile ? t("profile.editProfile") : t("profile.completeYourRegistration")}
          </DialogTitle>
          <DialogDescription>
            {hasProfile ? t("profile.updateYourInfo") : t("profile.fillDataToParticipate")}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="relative w-24 h-24 rounded-full bg-muted border-2 border-border overflow-hidden cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-foreground" />
                </div>
                {uploading && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <span className="text-xs text-muted-foreground">{t("profile.clickToChangeAvatar")}</span>
            </div>

            {/* Basic Fields */}
            <div className="grid gap-2">
              <Label htmlFor="full_name">{t("profile.fullNameLabel")}</Label>
              <Input id="full_name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} placeholder={t("profile.fullNamePlaceholder")} disabled={isLoading} />
              {errors.full_name && <span className="text-xs text-destructive">{errors.full_name}</span>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">{t("profile.usernameLabel")}</Label>
              <Input id="username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} placeholder={t("profile.usernamePlaceholder")} disabled={isLoading} />
              {errors.username && <span className="text-xs text-destructive">{errors.username}</span>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="weight">{t("profile.weightLabel")}</Label>
              <Input id="weight" type="number" step="0.1" value={formData.weight} onChange={(e) => setFormData({ ...formData, weight: e.target.value })} placeholder="75.0" disabled={isLoading} />
              {errors.weight && <span className="text-xs text-destructive">{errors.weight}</span>}
              <span className="text-xs text-muted-foreground">{t("profile.weightHelp")}</span>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="bio">{t("profile.aboutYou")}</Label>
              <Textarea id="bio" value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder={t("profile.aboutYouPlaceholder")} rows={3} disabled={isLoading} />
              {errors.bio && <span className="text-xs text-destructive">{errors.bio}</span>}
            </div>

            {/* Social Links */}
            <div className="border-t border-border pt-4">
              <h4 className="font-racing text-sm font-bold mb-3">{t("profile.socialLinks")}</h4>
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <Instagram className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Input value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} placeholder="@username" disabled={isLoading} />
                </div>
                <div className="flex items-center gap-2">
                  <Youtube className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Input value={formData.youtube} onChange={(e) => setFormData({ ...formData, youtube: e.target.value })} placeholder="youtube.com/c/channel" disabled={isLoading} />
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-muted-foreground shrink-0" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88A2.89 2.89 0 019.49 12.4a2.86 2.86 0 01.88.14V9.08a6.28 6.28 0 00-.88-.07 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.32a8.16 8.16 0 004.76 1.52V7.39a4.85 4.85 0 01-1-.7z"/>
                  </svg>
                  <Input value={formData.tiktok} onChange={(e) => setFormData({ ...formData, tiktok: e.target.value })} placeholder="@username" disabled={isLoading} />
                </div>
                {canShowWebsite ? (
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                    <Input value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://meusite.com" disabled={isLoading} />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                    <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("profile.websiteProOnly")}</p>
                      <p className="text-xs text-racing-yellow">{t("profile.upgradeToPro")}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={updateProfile.isPending || isLoading || uploading} className="w-full sm:w-auto">
              {updateProfile.isPending ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
