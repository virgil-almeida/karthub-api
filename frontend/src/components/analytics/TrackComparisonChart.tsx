import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { MapPin } from "lucide-react";
import type { TrackStats } from "@/hooks/useAnalyticsData";
import { formatSeconds } from "@/hooks/useAnalyticsData";
import { useTranslation } from "react-i18next";

interface TrackComparisonChartProps {
  data: TrackStats[];
  isLoading?: boolean;
}

export function TrackComparisonChart({ data, isLoading }: TrackComparisonChartProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (data.length === 0) {
    return (
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-racing-yellow" />
          <h2 className="font-racing text-lg font-bold">{t("analytics.trackComparison")}</h2>
        </div>
        <div className="h-56 flex flex-col items-center justify-center text-muted-foreground">
          <MapPin className="w-10 h-10 mb-2 opacity-50" />
          <p className="text-sm">{t("analytics.noTrackData")}</p>
        </div>
      </div>
    );
  }

  const chartData = data.slice(0, 8).map(d => ({
    name: d.trackName.substring(0, 12),
    bestLap: d.bestLap,
    avgLap: d.avgLap,
    races: d.totalRaces,
  }));

  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-racing-yellow" />
        <h2 className="font-racing text-lg font-bold">{t("analytics.trackComparison")}</h2>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 15%)" />
            <XAxis dataKey="name" stroke="hsl(220 10% 55%)" fontSize={9} />
            <YAxis stroke="hsl(220 10% 55%)" fontSize={10} tickFormatter={(v) => formatSeconds(v)} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(240 10% 6%)", border: "1px solid hsl(220 15% 15%)", borderRadius: "8px", fontFamily: "Orbitron, sans-serif" }}
              formatter={(value: number, name: string) => [formatSeconds(value), name === "bestLap" ? t("analytics.bestLap") : t("analytics.average")]}
            />
            <Bar dataKey="bestLap" fill="hsl(185 100% 50%)" radius={[4, 4, 0, 0]} name={t("analytics.bestLap")} />
            <Bar dataKey="avgLap" fill="hsl(220 15% 30%)" radius={[4, 4, 0, 0]} name={t("analytics.average")} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
        {data.slice(0, 8).map(d => (
          <div key={d.trackName} className="text-center p-2 rounded bg-muted/30">
            <p className="text-xs text-muted-foreground truncate">{d.trackName}</p>
            <p className="font-mono text-xs font-bold text-racing-cyan">{d.bestLapStr}</p>
            <p className="text-[10px] text-muted-foreground">{d.totalRaces} {t("analytics.racesLabel")}</p>
          </div>
        ))}
      </div>
    </div>
  );
}