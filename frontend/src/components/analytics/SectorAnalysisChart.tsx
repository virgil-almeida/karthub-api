import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from "recharts";
import { Compass } from "lucide-react";
import type { RaceLapData } from "@/hooks/useAnalyticsData";
import { useTranslation } from "react-i18next";

const COLORS = ["hsl(0 85% 50%)", "hsl(185 100% 50%)", "hsl(45 100% 50%)"];

interface SectorAnalysisChartProps {
  racesData: RaceLapData[];
  raceLabels?: Map<string, string>;
  isLoading?: boolean;
}

export function SectorAnalysisChart({ racesData, raceLabels, isLoading }: SectorAnalysisChartProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const racesWithSectors = racesData.filter(r => r.laps.some(l => l.sector1 && l.sector2 && l.sector3));

  if (racesWithSectors.length === 0) {
    return (
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-4">
          <Compass className="w-5 h-5 text-racing-orange" />
          <h2 className="font-racing text-lg font-bold">{t("analytics.sectorAnalysis")}</h2>
        </div>
        <div className="h-56 flex flex-col items-center justify-center text-muted-foreground">
          <Compass className="w-10 h-10 mb-2 opacity-50" />
          <p className="text-sm">{t("analytics.noSectorData")}</p>
        </div>
      </div>
    );
  }

  const chartData = [
    { sector: "S1", ...Object.fromEntries(racesWithSectors.map((r, i) => {
      const avgS1 = r.laps.filter(l => l.sector1).reduce((sum, l) => sum + l.sector1!, 0) / r.laps.filter(l => l.sector1).length;
      return [`race${i}`, Math.round(avgS1 * 1000) / 1000];
    })) },
    { sector: "S2", ...Object.fromEntries(racesWithSectors.map((r, i) => {
      const avgS2 = r.laps.filter(l => l.sector2).reduce((sum, l) => sum + l.sector2!, 0) / r.laps.filter(l => l.sector2).length;
      return [`race${i}`, Math.round(avgS2 * 1000) / 1000];
    })) },
    { sector: "S3", ...Object.fromEntries(racesWithSectors.map((r, i) => {
      const avgS3 = r.laps.filter(l => l.sector3).reduce((sum, l) => sum + l.sector3!, 0) / r.laps.filter(l => l.sector3).length;
      return [`race${i}`, Math.round(avgS3 * 1000) / 1000];
    })) },
  ];

  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 mb-4">
        <Compass className="w-5 h-5 text-racing-orange" />
        <h2 className="font-racing text-lg font-bold">{t("analytics.sectorAnalysis")}</h2>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData}>
            <PolarGrid stroke="hsl(220 15% 15%)" />
            <PolarAngleAxis dataKey="sector" stroke="hsl(220 10% 55%)" fontSize={12} />
            <PolarRadiusAxis stroke="hsl(220 10% 55%)" fontSize={9} />
            {racesWithSectors.map((r, i) => (
              <Radar
                key={r.raceId}
                name={raceLabels?.get(r.raceId)?.substring(0, 15) || `${t("analytics.race")} ${i + 1}`}
                dataKey={`race${i}`}
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            ))}
            {racesWithSectors.length > 1 && <Legend wrapperStyle={{ fontSize: "10px" }} />}
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}