import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useDriverStats } from "@/hooks/useDriverStats";
import { useCurrentProfile } from "@/hooks/useProfiles";
import { StatCard } from "@/components/dashboard/StatCard";
import { CareerChart } from "@/components/dashboard/CareerChart";
import { BadgesDisplay } from "@/components/dashboard/BadgesDisplay";
import { ProfileEditDialog } from "@/components/profile/ProfileEditDialog";
import { RaceTypeFilter, type RaceFilterType } from "@/components/dashboard/RaceTypeFilter";
import { AddStandaloneRaceDialog } from "@/components/career/AddStandaloneRaceDialog";
import { StandaloneRacesList } from "@/components/career/StandaloneRacesList";
import { Trophy, Timer, Flag, Gauge, Target, TrendingUp, Medal, Zap, AlertCircle } from "lucide-react";
import { Navigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Career() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const [filter, setFilter] = useState<RaceFilterType>("all");
  const { data: stats, isLoading } = useDriverStats(user?.id, filter);
  const { data: profile } = useCurrentProfile();

  if (authLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const displayStats = stats || { totalRaces: 0, wins: 0, podiums: 0, bestPosition: null, averagePosition: 0, totalPoints: 0, fastestLaps: 0 };
  const needsProfileSetup = !profile?.full_name;

  return (
    <div className="space-y-6 animate-slide-in">
      {needsProfileSetup && (
        <Alert variant="destructive" className="border-racing-yellow/50 bg-racing-yellow/10">
          <AlertCircle className="h-4 w-4 text-racing-yellow" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-racing-yellow">{t("career.completeProfile")}</span>
            <ProfileEditDialog />
          </AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-racing text-3xl font-bold text-gradient-racing">{t("career.title")}</h1>
          <p className="text-muted-foreground mt-1">
            {profile?.full_name ? t("career.statsOf", { name: profile.full_name }) : t("career.defaultSubtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AddStandaloneRaceDialog />
          {!needsProfileSetup && <ProfileEditDialog />}
        </div>
      </div>

      <RaceTypeFilter value={filter} onChange={setFilter} />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard title={t("career.totalRaces")} value={displayStats.totalRaces} icon={Flag} variant="default" />
        <StatCard title={t("career.wins")} value={displayStats.wins} icon={Trophy} variant="racing" />
        <StatCard title={t("career.podiums")} value={displayStats.podiums} icon={Medal} variant="cyan" />
        <StatCard title={t("career.totalPoints")} value={displayStats.totalPoints} icon={Target} variant="racing" />
        <StatCard title={t("career.avgPosition")} value={displayStats.averagePosition.toFixed(1)} icon={TrendingUp} variant="default" />
        <StatCard title={t("career.fastLaps")} value={displayStats.fastestLaps} icon={Zap} variant="cyan" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-4">
              <Gauge className="w-5 h-5 text-primary" />
              <h2 className="font-racing text-xl font-bold">{t("career.last10Evolution")}</h2>
            </div>
            <CareerChart filter={filter} />
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-primary" /><span>{t("career.finalPosition")}</span></div>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <BadgesDisplay />
          <div className="stat-card">
            <div className="flex items-center gap-2 mb-4">
              <Timer className="w-5 h-5 text-racing-cyan" />
              <h3 className="font-racing text-lg font-bold">{t("career.bestResults")}</h3>
            </div>
            {displayStats.totalRaces > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-racing-yellow/10 border border-racing-yellow/20">
                  <span className="text-sm text-racing-yellow">{t("career.bestPosition")}</span>
                  <span className="font-racing text-xl font-bold text-racing-yellow">{displayStats.bestPosition ? `P${displayStats.bestPosition}` : "-"}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <span className="text-sm text-primary">{t("career.wins")}</span>
                  <span className="font-racing text-xl font-bold text-primary">{displayStats.wins}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-racing-cyan/10 border border-racing-cyan/20">
                  <span className="text-sm text-racing-cyan">{t("career.podiums")}</span>
                  <span className="font-racing text-xl font-bold text-racing-cyan">{displayStats.podiums}</span>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-6">
                <p className="text-sm">{t("career.noResultsYet")}</p>
                <p className="text-xs">{t("career.participateToSeeStats")}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="stat-card">
        <div className="flex items-center gap-2 mb-4">
          <Flag className="w-5 h-5 text-racing-yellow" />
          <h2 className="font-racing text-xl font-bold">{t("career.standaloneRaces")}</h2>
        </div>
        <StandaloneRacesList />
      </div>
    </div>
  );
}
