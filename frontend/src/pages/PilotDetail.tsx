import { useParams, Link } from "react-router-dom";
import { useProfile } from "@/hooks/useProfiles";
import { useDriverStats, useDriverBadges } from "@/hooks/useDriverStats";
import { useCanViewFeature } from "@/hooks/useFeatureVisibility";
import { useBadgeDefinitions } from "@/hooks/useBadgeDefinitions";
import { getIconComponent, getColorClasses } from "@/lib/iconMapper";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Trophy, Medal, Flag, Zap, Crown, Instagram, Youtube, Globe, Lock, Target, Timer } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { CareerChart } from "@/components/dashboard/CareerChart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function PilotDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { data: profile, isLoading: profileLoading } = useProfile(id);
  const { data: stats, isLoading: statsLoading } = useDriverStats(id);
  const { data: badges = [] } = useDriverBadges(id);
  const { data: definitions = [] } = useBadgeDefinitions();

  const canViewStats = useCanViewFeature("profile_stats");
  const canViewBadges = useCanViewFeature("profile_badges");
  const canViewSocial = useCanViewFeature("profile_social_links");
  const canViewWebsite = useCanViewFeature("profile_website");

  // Recent races from heat_results_public
  const { data: recentRaces = [] } = useQuery({
    queryKey: ["pilotRecentRaces", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("heat_results_public")
        .select(`position, best_lap_time, points, created_at, heat:heats(name, event:events(name, date))`)
        .eq("driver_id", id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (error || !data) return [];
      return data;
    },
    enabled: !!id,
  });

  if (profileLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6 animate-slide-in">
        <Link to="/pilots">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t("common.back")}
          </Button>
        </Link>
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t("pilots.pilotNotFound")}</p>
        </div>
      </div>
    );
  }

  const initials = (profile.full_name || "P").slice(0, 2).toUpperCase();

  const earnedDefIds = new Set(badges.map((b) => b.badge_definition_id).filter(Boolean));
  const displayBadges = definitions
    .map((def) => ({
      ...def,
      earned: earnedDefIds.has(def.id),
      Icon: getIconComponent(def.icon_name),
      colors: getColorClasses(def.color),
    }))
    .filter((b) => b.earned);

  const hasSocials = profile.instagram || profile.youtube || profile.tiktok || (canViewWebsite && profile.website);

  return (
    <div className="space-y-6 animate-slide-in">
      <Link to="/pilots">
        <Button variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          {t("common.back")}
        </Button>
      </Link>

      {/* Profile Header */}
      <div className="stat-card">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <Avatar className="w-24 h-24 border-2 border-primary/50">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name || ""} />
            <AvatarFallback className="text-2xl font-racing bg-primary/20 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="font-racing text-2xl md:text-3xl font-bold text-foreground">
                {profile.full_name || profile.username || "Piloto"}
              </h1>
              {profile.is_pro_member && (
                <Crown className="w-5 h-5 text-racing-yellow" />
              )}
            </div>
            {profile.username && (
              <p className="text-racing-cyan mt-1">@{profile.username}</p>
            )}
            {profile.bio && (
              <p className="text-muted-foreground mt-3 max-w-lg">{profile.bio}</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {t("pilots.since")} {new Date(profile.created_at).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      {/* Social Links */}
      {canViewSocial ? (
        hasSocials && (
          <div className="stat-card">
            <h3 className="font-racing text-lg font-bold mb-4">{t("profile.socialLinks")}</h3>
            <div className="flex flex-wrap gap-3">
              {profile.instagram && (
                <a href={`https://instagram.com/${profile.instagram.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                  <Instagram className="w-4 h-4 text-racing-cyan" />
                  <span className="text-sm">{profile.instagram}</span>
                </a>
              )}
              {profile.youtube && (
                <a href={profile.youtube.startsWith("http") ? profile.youtube : `https://youtube.com/${profile.youtube}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                  <Youtube className="w-4 h-4 text-destructive" />
                  <span className="text-sm">{profile.youtube}</span>
                </a>
              )}
              {profile.tiktok && (
                <a href={`https://tiktok.com/${profile.tiktok.replace("@", "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                  <svg className="w-4 h-4 text-foreground" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.88-2.88A2.89 2.89 0 019.49 12.4a2.86 2.86 0 01.88.14V9.08a6.28 6.28 0 00-.88-.07 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.32a8.16 8.16 0 004.76 1.52V7.39a4.85 4.85 0 01-1-.7z"/>
                  </svg>
                  <span className="text-sm">{profile.tiktok}</span>
                </a>
              )}
              {canViewWebsite && profile.website && (
                <a href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                  <Globe className="w-4 h-4 text-racing-green" />
                  <span className="text-sm">{profile.website}</span>
                </a>
              )}
            </div>
          </div>
        )
      ) : (
        <LockedSection label={t("profile.socialLinks")} />
      )}

      {/* Stats */}
      {canViewStats ? (
        stats && (
          <div className="stat-card">
            <h3 className="font-racing text-lg font-bold mb-4">{t("pilots.statistics")}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <StatItem icon={<Flag className="w-5 h-5 text-racing-cyan" />} label={t("career.totalRaces")} value={stats.totalRaces} />
              <StatItem icon={<Trophy className="w-5 h-5 text-racing-yellow" />} label={t("career.wins")} value={stats.wins} />
              <StatItem icon={<Medal className="w-5 h-5 text-racing-orange" />} label={t("career.podiums")} value={stats.podiums} />
              <StatItem icon={<Zap className="w-5 h-5 text-racing-green" />} label={t("career.totalPoints")} value={stats.totalPoints} />
              <StatItem icon={<Target className="w-5 h-5 text-racing-cyan" />} label={t("career.avgPosition")} value={stats.totalRaces > 0 ? Number((stats.totalPoints / Math.max(stats.totalRaces, 1)).toFixed(1)) : 0} />
              <StatItem icon={<Timer className="w-5 h-5 text-racing-yellow" />} label={t("career.fastLaps")} value={stats.wins} />
            </div>
          </div>
        )
      ) : (
        <LockedSection label={t("pilots.statistics")} />
      )}

      {/* Evolution Chart */}
      {canViewStats && id && (
        <div className="stat-card">
          <h3 className="font-racing text-lg font-bold mb-4">{t("pilots.evolution")}</h3>
          <CareerChart profileId={id} />
        </div>
      )}

      {/* Recent Races */}
      {canViewStats && recentRaces.length > 0 && (
        <div className="stat-card">
          <h3 className="font-racing text-lg font-bold mb-4">{t("pilots.recentRaces")}</h3>
          <div className="space-y-3">
            {recentRaces.map((race, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center font-racing font-bold text-sm",
                    race.position === 1 ? "bg-racing-yellow/20 text-racing-yellow" :
                    race.position && race.position <= 3 ? "bg-racing-orange/20 text-racing-orange" :
                    "bg-muted text-muted-foreground"
                  )}>
                    P{race.position || "-"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {race.heat?.event?.name || race.heat?.name || `Race ${i + 1}`}
                    </p>
                    {race.heat?.event?.date && (
                      <p className="text-xs text-muted-foreground">
                        {new Date(race.heat.event.date).toLocaleDateString("pt-BR")}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {race.best_lap_time && <span>TMV: {race.best_lap_time}</span>}
                  {race.points != null && <span className="font-racing text-foreground">{race.points} pts</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Badges */}
      {canViewBadges ? (
        displayBadges.length > 0 && (
          <div className="stat-card">
            <h3 className="font-racing text-lg font-bold mb-4">{t("badges.achievements")}</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {displayBadges.map((badge) => {
                const Icon = badge.Icon;
                return (
                  <div key={badge.id} className={cn("flex flex-col items-center p-3 rounded-lg", badge.colors.bg, "border border-current/20")} title={badge.name}>
                    {badge.custom_image_url ? (
                      <img src={badge.custom_image_url} alt={badge.name} className="w-6 h-6 mb-1 object-contain" />
                    ) : (
                      <Icon className={cn("w-6 h-6 mb-1", badge.colors.text)} />
                    )}
                    <span className={cn("text-[10px] text-center font-medium", badge.colors.text)}>{badge.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : (
        <LockedSection label={t("badges.achievements")} />
      )}
    </div>
  );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
      {icon}
      <div>
        <p className="text-xl font-racing font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

function LockedSection({ label }: { label: string }) {
  const { t } = useTranslation();
  return (
    <div className="stat-card flex items-center gap-4 opacity-60">
      <Lock className="w-6 h-6 text-muted-foreground" />
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{t("profile.upgradeToView")}</p>
      </div>
    </div>
  );
}
