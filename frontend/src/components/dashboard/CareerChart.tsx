import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import type { RaceFilterType } from "@/components/dashboard/RaceTypeFilter";

interface RacePosition {
  race: string;
  position: number;
  type: "championship" | "training" | "standalone";
}

interface CareerChartProps {
  filter?: RaceFilterType;
  profileId?: string;
}

export function CareerChart({ filter = "all", profileId }: CareerChartProps) {
  const { user } = useAuth();
  const driverId = profileId || user?.id;
  
  const { data: chartData = [], isLoading } = useQuery({
    queryKey: ["careerChart", driverId, filter],
    queryFn: async (): Promise<RacePosition[]> => {
      if (!driverId) return [];

      const results: RacePosition[] = [];

      // Championship races
      if (filter === "all" || filter === "championship") {
        const { data, error } = await supabase
          .from("heat_results_public")
          .select(`position, created_at, heat:heats(name, event:events(name))`)
          .eq("driver_id", driverId)
          .order("created_at", { ascending: true })
          .limit(10);

        if (!error && data) {
          data.forEach((r, i) => {
            if (r.position != null) {
              results.push({
                race: r.heat?.event?.name ? r.heat.event.name.substring(0, 10) : `Camp ${i + 1}`,
                position: r.position,
                type: "championship",
              });
            }
          });
        }
      }

      // Standalone/training races
      if (filter === "all" || filter === "training" || filter === "standalone") {
        let query = supabase
          .from("standalone_races")
          .select("position, date, track_name, race_type")
          .eq("user_id", driverId)
          .not("position", "is", null)
          .order("date", { ascending: true })
          .limit(10);

        if (filter === "training") query = query.eq("race_type", "training");
        else if (filter === "standalone") query = query.eq("race_type", "standalone");

        const { data, error } = await query;
        if (!error && data) {
          data.forEach((r, i) => {
            if (r.position != null) {
              results.push({
                race: r.track_name ? r.track_name.substring(0, 10) : `${r.race_type === "training" ? "Treino" : "Avulsa"} ${i + 1}`,
                position: r.position,
                type: r.race_type as "training" | "standalone",
              });
            }
          });
        }
      }

      // Sort by date and take last 10
      return results.slice(-10);
    },
    enabled: !!driverId,
  });

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
        <p className="font-racing text-lg">Sem dados de corridas</p>
        <p className="text-sm">Participe de etapas ou registre treinos para ver sua evolução</p>
      </div>
    );
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="positionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(0 85% 50%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(0 85% 50%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 15%)" />
          <XAxis dataKey="race" stroke="hsl(220 10% 55%)" fontSize={10} tickLine={false} />
          <YAxis reversed domain={[1, 10]} stroke="hsl(220 10% 55%)" fontSize={10} tickLine={false} tickFormatter={(v) => `P${v}`} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(240 10% 6%)",
              border: "1px solid hsl(220 15% 15%)",
              borderRadius: "8px",
              fontFamily: "Orbitron, sans-serif",
            }}
            labelStyle={{ color: "hsl(0 0% 98%)" }}
            formatter={(value: number) => [`P${value}`, "Posição"]}
          />
          <Area type="monotone" dataKey="position" stroke="hsl(0 85% 50%)" strokeWidth={2} fill="url(#positionGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
