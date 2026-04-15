import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Timer } from "lucide-react";
import type { RaceLapData } from "@/hooks/useAnalyticsData";
import { formatSeconds } from "@/hooks/useAnalyticsData";
import { useTranslation } from "react-i18next";

const COLORS = ["hsl(0 85% 50%)", "hsl(185 100% 50%)", "hsl(45 100% 50%)"];

interface LapTimeEvolutionChartProps {
  racesData: RaceLapData[];
  raceLabels?: Map<string, string>;
  isLoading?: boolean;
}

export function LapTimeEvolutionChart({ racesData, raceLabels, isLoading }: LapTimeEvolutionChartProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (racesData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
        <Timer className="w-10 h-10 mb-2 opacity-50" />
        <p className="text-sm">{t("analytics.selectTelemetryRaces")}</p>
      </div>
    );
  }

  const maxLaps = Math.max(...racesData.map(r => r.laps.length));
  const chartData = Array.from({ length: maxLaps }, (_, i) => {
    const point: any = { lap: i + 1 };
    racesData.forEach((race, idx) => {
      const lap = race.laps.find(l => l.lap === i + 1);
      if (lap) point[`race${idx}`] = lap.time;
    });
    return point;
  });

  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 mb-4">
        <Timer className="w-5 h-5 text-primary" />
        <h2 className="font-racing text-lg font-bold">{t("analytics.lapTimeEvolution")}</h2>
      </div>
      {racesData.length > 1 && (
        <div className="flex flex-wrap gap-3 mb-3">
          {racesData.map((r, i) => (
            <div key={r.raceId} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-1 rounded" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
              {raceLabels?.get(r.raceId) || `${t("analytics.race")} ${i + 1}`}
            </div>
          ))}
        </div>
      )}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 15%)" />
            <XAxis dataKey="lap" stroke="hsl(220 10% 55%)" fontSize={10} tickFormatter={(v) => `V${v}`} />
            <YAxis stroke="hsl(220 10% 55%)" fontSize={10} tickFormatter={(v) => formatSeconds(v)} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(240 10% 6%)", border: "1px solid hsl(220 15% 15%)", borderRadius: "8px", fontFamily: "Orbitron, sans-serif" }}
              labelFormatter={(v) => `${t("analytics.lap")} ${v}`}
              formatter={(value: number) => [formatSeconds(value), t("analytics.time")]}
            />
            {racesData.map((_, i) => (
              <Line key={i} type="monotone" dataKey={`race${i}`} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}