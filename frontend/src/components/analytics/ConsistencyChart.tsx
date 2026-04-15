import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Activity } from "lucide-react";
import type { ConsistencyData } from "@/hooks/useAnalyticsData";
import { useTranslation } from "react-i18next";

interface ConsistencyChartProps {
  data: ConsistencyData[];
  raceLabels?: Map<string, string>;
  isLoading?: boolean;
}

export function ConsistencyChart({ data, raceLabels, isLoading }: ConsistencyChartProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
        <Activity className="w-10 h-10 mb-2 opacity-50" />
        <p className="text-sm">{t("analytics.selectTelemetryForAnalysis")}</p>
      </div>
    );
  }

  const chartData = data.map((d, i) => ({
    name: raceLabels?.get(d.raceLabel)?.substring(0, 15) || `${t("analytics.race")} ${i + 1}`,
    stdDev: Math.round(d.stdDev * 1000) / 1000,
    laps: d.lapsCount,
  }));

  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-racing-purple" />
        <h2 className="font-racing text-lg font-bold">{t("analytics.consistencyAnalysis")}</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{t("analytics.stdDevDesc")}</p>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 15%)" />
            <XAxis type="number" stroke="hsl(220 10% 55%)" fontSize={10} tickFormatter={(v) => `${v}s`} />
            <YAxis type="category" dataKey="name" stroke="hsl(220 10% 55%)" fontSize={9} width={100} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(240 10% 6%)", border: "1px solid hsl(220 15% 15%)", borderRadius: "8px", fontFamily: "Orbitron, sans-serif" }}
              formatter={(value: number) => [`${value}s`, t("analytics.stdDev")]}
            />
            <Bar dataKey="stdDev" fill="hsl(270 80% 60%)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}