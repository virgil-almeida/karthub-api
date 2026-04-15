import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingDown } from "lucide-react";
import { formatSeconds } from "@/hooks/useAnalyticsData";
import { useTranslation } from "react-i18next";

interface BestLapEntry {
  date: string;
  bestLap: number;
  bestLapStr: string;
  label: string;
}

interface BestLapEvolutionChartProps {
  data: BestLapEntry[];
  isLoading?: boolean;
}

export function BestLapEvolutionChart({ data, isLoading }: BestLapEvolutionChartProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  if (data.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
        <TrendingDown className="w-10 h-10 mb-2 opacity-50" />
        <p className="text-sm">{t("analytics.noBestLapData")}</p>
      </div>
    );
  }

  const chartData = data.map((d, i) => ({
    idx: i + 1,
    bestLap: d.bestLap,
    label: d.label.substring(0, 12),
    date: new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
  }));

  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 mb-4">
        <TrendingDown className="w-5 h-5 text-racing-green" />
        <h2 className="font-racing text-lg font-bold">{t("analytics.bestLapEvolution")}</h2>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="bestLapGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(145 80% 45%)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(145 80% 45%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 15%)" />
            <XAxis dataKey="date" stroke="hsl(220 10% 55%)" fontSize={10} />
            <YAxis stroke="hsl(220 10% 55%)" fontSize={10} tickFormatter={(v) => formatSeconds(v)} />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(240 10% 6%)", border: "1px solid hsl(220 15% 15%)", borderRadius: "8px", fontFamily: "Orbitron, sans-serif" }}
              formatter={(value: number) => [formatSeconds(value), t("analytics.bestLap")]}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.label || ""}
            />
            <Area type="monotone" dataKey="bestLap" stroke="hsl(145 80% 45%)" strokeWidth={2} fill="url(#bestLapGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}