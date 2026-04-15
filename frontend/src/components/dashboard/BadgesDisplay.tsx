import { useAuth } from "@/contexts/AuthContext";
import { useDriverBadges } from "@/hooks/useDriverStats";
import { useBadgeDefinitions } from "@/hooks/useBadgeDefinitions";
import { Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { getIconComponent, getColorClasses } from "@/lib/iconMapper";
import { useTranslation } from "react-i18next";

export function BadgesDisplay() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: earnedBadges = [], isLoading: badgesLoading } = useDriverBadges(user?.id);
  const { data: definitions = [], isLoading: defsLoading } = useBadgeDefinitions();

  const isLoading = badgesLoading || defsLoading;
  const earnedDefIds = new Set(earnedBadges.map(b => b.badge_definition_id).filter(Boolean));

  const allBadges = definitions.map(def => {
    const earned = earnedDefIds.has(def.id);
    const Icon = getIconComponent(def.icon_name);
    const colors = getColorClasses(def.color);
    return { ...def, earned, Icon, colors };
  });

  // Hide unearned badges that have show_preview disabled
  const badges = allBadges.filter(b => b.earned || b.show_preview !== false);

  const earnedCount = badges.filter(b => b.earned).length;

  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 mb-4">
        <Award className="w-5 h-5 text-racing-yellow" />
        <h3 className="font-racing text-lg font-bold">{t("badges.achievements")}</h3>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-24">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : badges.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-6">
          {t("badges.noBadgesDefined")}
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {badges.map((badge) => {
            const Icon = badge.Icon;
            return (
              <div
                key={badge.id}
                className={cn(
                  "flex flex-col items-center p-3 rounded-lg transition-all",
                  badge.earned 
                    ? `${badge.colors.bg} border border-current/20` 
                    : "bg-muted/30 opacity-40"
                )}
                title={badge.earned ? `${t("badges.conqueredLabel")}: ${badge.name}` : `${t("badges.notConquered")}: ${badge.name}`}
              >
                {badge.custom_image_url ? (
                  <img src={badge.custom_image_url} alt={badge.name} className="w-6 h-6 mb-1 object-contain" />
                ) : (
                  <Icon className={cn("w-6 h-6 mb-1", badge.earned ? badge.colors.text : "text-muted-foreground")} />
                )}
                <span className={cn(
                  "text-[10px] text-center font-medium",
                  badge.earned ? badge.colors.text : "text-muted-foreground"
                )}>
                  {badge.name}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {user && earnedCount > 0 && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          {earnedCount} de {badges.length} {t("badges.earned")}
        </p>
      )}
      
      {user && badges.length > 0 && earnedCount === 0 && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          {t("badges.noAchievementsYet")}
        </p>
      )}
    </div>
  );
}