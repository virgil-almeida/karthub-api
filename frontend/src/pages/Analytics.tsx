import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useDriverStats } from "@/hooks/useDriverStats";
import { useRacesList, useLapTimesForRaces, useBestLapEvolution, useTrackComparison, useConsistencyData, useAnalyticsKPIs } from "@/hooks/useAnalyticsData";
import { StatCard } from "@/components/dashboard/StatCard";
import { CareerChart } from "@/components/dashboard/CareerChart";
import { RaceTypeFilter, type RaceFilterType } from "@/components/dashboard/RaceTypeFilter";
import { WidgetTogglePanel, type WidgetPreferences, defaultWidgetPreferences } from "@/components/analytics/WidgetTogglePanel";
import { RaceSelector, type SelectionMode } from "@/components/analytics/RaceSelector";
import { LapTimeEvolutionChart } from "@/components/analytics/LapTimeEvolutionChart";
import { BestLapEvolutionChart } from "@/components/analytics/BestLapEvolutionChart";
import { ConsistencyChart } from "@/components/analytics/ConsistencyChart";
import { SectorAnalysisChart } from "@/components/analytics/SectorAnalysisChart";
import { TrackComparisonChart } from "@/components/analytics/TrackComparisonChart";
import { DetailedTimesTable } from "@/components/analytics/DetailedTimesTable";
import { HeadToHeadPanel } from "@/components/analytics/HeadToHeadPanel";
import { Trophy, Target, TrendingUp, Flag, Lock, Gauge, Timer, Zap, MapPin, Award } from "lucide-react";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const STORAGE_KEY = "analytics-widgets";

function loadPreferences(): WidgetPreferences {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...defaultWidgetPreferences, ...JSON.parse(saved) };
  } catch {}
  return defaultWidgetPreferences;
}

export default function Analytics() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading, canViewAnalytics } = useAuth();
  const [filter, setFilter] = useState<RaceFilterType>("all");
  const [widgets, setWidgets] = useState<WidgetPreferences>(loadPreferences);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("all");
  const [selectedRaces, setSelectedRaces] = useState<string[]>([]);

  const { data: stats } = useDriverStats(user?.id, filter);
  const { data: kpis } = useAnalyticsKPIs(filter);
  const { data: racesList = [], isLoading: racesLoading } = useRacesList(filter);
  const { data: bestLapData = [], isLoading: bestLapLoading } = useBestLapEvolution(filter);
  const { data: trackData = [], isLoading: trackLoading } = useTrackComparison(filter);

  // Determine which races to fetch telemetry for
  const telemetryRaceIds = useMemo(() => {
    if (selectionMode === "all") return racesList.slice(0, 5).map(r => r.id);
    return selectedRaces;
  }, [selectionMode, selectedRaces, racesList]);

  const { data: lapData = [], isLoading: lapLoading } = useLapTimesForRaces(telemetryRaceIds);
  const { data: consistencyData, isLoading: consistencyLoading } = useConsistencyData(telemetryRaceIds);

  // Race label map
  const raceLabels = useMemo(() => {
    const m = new Map<string, string>();
    racesList.forEach(r => m.set(r.id, r.label));
    return m;
  }, [racesList]);

  // Save widget preferences
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  }, [widgets]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!canViewAnalytics) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Lock className="w-16 h-16 text-muted-foreground opacity-50" />
        <h1 className="font-racing text-2xl font-bold">{t("analytics.restrictedAccess")}</h1>
        <p className="text-muted-foreground text-center max-w-md">{t("analytics.analyticsRestricted")}</p>
        <Button asChild variant="outline"><Link to="/">{t("analytics.backToDashboard")}</Link></Button>
      </div>
    );
  }

  const displayStats = stats || { totalRaces: 0, wins: 0, podiums: 0, bestPosition: null, averagePosition: 0, totalPoints: 0, fastestLaps: 0 };

  return (
    <div className="space-y-6 animate-slide-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-racing text-3xl font-bold text-gradient-racing">{t("analytics.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("analytics.subtitle")}</p>
        </div>
        <WidgetTogglePanel preferences={widgets} onChange={setWidgets} />
      </div>

      {/* Filters & Race Selector */}
      <div className="space-y-3">
        <RaceTypeFilter value={filter} onChange={setFilter} />
        <RaceSelector
          races={racesList}
          mode={selectionMode}
          onModeChange={setSelectionMode}
          selectedRaces={selectedRaces}
          onSelectedChange={setSelectedRaces}
          isLoading={racesLoading}
        />
      </div>

      {/* KPIs */}
      {widgets.kpis && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <StatCard title={t("analytics.totalRaces")} value={displayStats.totalRaces} subtitle={t("analytics.filtered")} icon={Flag} variant="racing" />
          <StatCard title={t("career.wins")} value={displayStats.wins} subtitle={t("analytics.winsP1")} icon={Trophy} variant="racing" />
          <StatCard title={t("analytics.avgPosition")} value={displayStats.averagePosition.toFixed(1)} subtitle={t("analytics.general")} icon={TrendingUp} variant="default" />
          <StatCard title={t("common.points")} value={displayStats.totalPoints} subtitle={t("analytics.accumulated")} icon={Target} variant="cyan" />
          {kpis?.bestLapAllTime && (
            <StatCard title={t("analytics.bestLap")} value={kpis.bestLapAllTime} subtitle={t("analytics.allTime")} icon={Zap} variant="cyan" />
          )}
          {kpis?.favoriteTrack && (
            <StatCard title={t("analytics.favoriteTrack")} value={kpis.favoriteTrack.substring(0, 10)} subtitle={t("analytics.racesCount", { count: kpis.favoriteTrackCount })} icon={MapPin} variant="default" />
          )}
          {kpis && kpis.podiumRate > 0 && (
            <StatCard title={t("analytics.podiumRate")} value={`${kpis.podiumRate}%`} subtitle={t("analytics.top3")} icon={Award} variant="racing" />
          )}
          {kpis?.consistencyScore != null && (
            <StatCard title={t("analytics.consistency")} value={kpis.consistencyScore.toFixed(2)} subtitle={t("analytics.positionStdDev")} icon={Timer} variant="default" />
          )}
        </div>
      )}

      {/* Position Evolution */}
      {widgets.positionEvolution && (
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="w-5 h-5 text-primary" />
            <h2 className="font-racing text-lg font-bold">{t("analytics.positionEvolution")}</h2>
          </div>
          <CareerChart filter={filter} />
        </div>
      )}

      {/* Lap Time Evolution */}
      {widgets.lapTimeEvolution && (
        <LapTimeEvolutionChart racesData={lapData} raceLabels={raceLabels} isLoading={lapLoading} />
      )}

      {/* Two columns row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Lap Evolution */}
        {widgets.bestLapEvolution && (
          <BestLapEvolutionChart data={bestLapData} isLoading={bestLapLoading} />
        )}

        {/* Consistency */}
        {widgets.consistency && (
          <ConsistencyChart data={consistencyData} raceLabels={raceLabels} isLoading={consistencyLoading} />
        )}
      </div>

      {/* Sector Analysis */}
      {widgets.sectorAnalysis && (
        <SectorAnalysisChart racesData={lapData} raceLabels={raceLabels} isLoading={lapLoading} />
      )}

      {/* Track Comparison */}
      {widgets.trackComparison && (
        <TrackComparisonChart data={trackData} isLoading={trackLoading} />
      )}

      {/* Detailed Times Table */}
      {widgets.detailedTimes && (
        <DetailedTimesTable racesData={lapData} raceLabels={raceLabels} isLoading={lapLoading} />
      )}

      {/* Head to Head */}
      {widgets.headToHead && (
        <HeadToHeadPanel />
      )}

      {/* Legend */}
      <div className="stat-card">
        <h3 className="font-racing text-lg font-bold mb-4">{t("analytics.legendTitle")}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-primary">TMV</span>
            <span className="text-muted-foreground">{t("analytics.tmv")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-racing-cyan">DA</span>
            <span className="text-muted-foreground">{t("analytics.da")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-racing-yellow">DL</span>
            <span className="text-muted-foreground">{t("analytics.dl")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-racing-green">VM</span>
            <span className="text-muted-foreground">{t("analytics.vm")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
