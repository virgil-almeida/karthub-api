import { useTranslation } from "react-i18next";
import { useFeatureVisibility, useUpdateFeatureVisibility } from "@/hooks/useFeatureVisibility";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { SubscriptionTier } from "@/contexts/AuthContext";

const TIERS: { value: SubscriptionTier; label: string }[] = [
  { value: "free", label: "Free" },
  { value: "user", label: "User" },
  { value: "plus", label: "Plus" },
  { value: "moderator", label: "Moderator" },
  { value: "admin", label: "Admin" },
];

export function FeatureVisibilityManager() {
  const { t } = useTranslation();
  const { data: features, isLoading } = useFeatureVisibility();
  const updateFeature = useUpdateFeatureVisibility();

  const handleChange = async (id: string, min_tier: SubscriptionTier) => {
    try {
      await updateFeature.mutateAsync({ id, min_tier });
      toast.success(t("admin.visibilityUpdated"));
    } catch {
      toast.error(t("common.error"));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-racing text-lg font-bold">{t("admin.featureVisibility")}</h3>
        <p className="text-sm text-muted-foreground mt-1">{t("admin.featureVisibilityDesc")}</p>
      </div>

      <div className="space-y-3">
        {features?.map((feature) => (
          <div key={feature.id} className="stat-card flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-foreground">{feature.label}</p>
              <p className="text-xs text-muted-foreground font-mono">{feature.feature_key}</p>
            </div>
            <Select
              value={feature.min_tier}
              onValueChange={(val) => handleChange(feature.id, val as SubscriptionTier)}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIERS.map((tier) => (
                  <SelectItem key={tier.value} value={tier.value}>
                    {tier.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
