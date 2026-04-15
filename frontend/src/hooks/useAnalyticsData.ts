import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { RaceFilterType } from "@/components/dashboard/RaceTypeFilter";

// Types
export interface RaceOption {
  id: string;
  label: string;
  date: string;
  type: "championship" | "standalone" | "training";
  trackName: string | null;
}

export interface LapTimeData {
  lap: number;
  time: number; // in seconds
  timeStr: string;
  sector1?: number;
  sector2?: number;
  sector3?: number;
  averageSpeed?: number;
  gapToBest?: string;
  gapToLeader?: string;
  kartNumber?: number;
  totalTime?: string;
}

export interface RaceLapData {
  raceId: string;
  raceLabel: string;
  laps: LapTimeData[];
  bestLapIndex: number;
  worstLapIndex: number;
}

export interface TrackStats {
  trackName: string;
  totalRaces: number;
  bestLap: number;
  bestLapStr: string;
  avgLap: number;
  avgLapStr: string;
}

export interface ConsistencyData {
  raceLabel: string;
  stdDev: number;
  avgTime: number;
  lapsCount: number;
}

export interface H2HBestLapByTrack {
  trackName: string;
  lapTime: number;
  lapTimeStr: string;
}

export interface H2HAvgSpeedByHeat {
  heatId: string;
  heatLabel: string;
  avgSpeed: number;
}

export interface H2HLapTelemetry {
  lap: number;
  time: number;
  timeStr: string;
}

export interface H2HCommonHeat {
  heatId: string;
  label: string;
}

export interface HeadToHeadStats {
  driverName: string;
  driverId: string;
  wins: number;
  podiums: number;
  avgPosition: number;
  totalPoints: number;
  races: number;
  bestPosition: number;
  bestLapsByTrack: H2HBestLapByTrack[];
  avgSpeeds: H2HAvgSpeedByHeat[];
  avgBestLap: number | null;
  avgSpeedOverall: number | null;
  consistencyByHeat: { heatId: string; label: string; stdDev: number }[];
}

export interface HeadToHeadResult {
  driver1: HeadToHeadStats;
  driver2: HeadToHeadStats;
  commonHeats: H2HCommonHeat[];
  lapTelemetryByHeat: Map<string, { driver1: H2HLapTelemetry[]; driver2: H2HLapTelemetry[] }>;
}

// Utility to parse lap time string to seconds
export function parseLapTime(timeStr: string | null): number | null {
  if (!timeStr) return null;
  // Formats: "1:02.345", "62.345", "1.02.345"
  const parts = timeStr.replace(",", ".").split(":");
  if (parts.length === 2) {
    const mins = parseFloat(parts[0]);
    const secs = parseFloat(parts[1]);
    if (!isNaN(mins) && !isNaN(secs)) return mins * 60 + secs;
  }
  const dotParts = timeStr.replace(",", ".").split(".");
  if (dotParts.length === 3) {
    const mins = parseInt(dotParts[0]);
    const secs = parseInt(dotParts[1]);
    const ms = parseInt(dotParts[2]);
    if (!isNaN(mins) && !isNaN(secs) && !isNaN(ms)) return mins * 60 + secs + ms / 1000;
  }
  const val = parseFloat(timeStr.replace(",", "."));
  return isNaN(val) ? null : val;
}

export function formatSeconds(secs: number): string {
  const mins = Math.floor(secs / 60);
  const rest = (secs % 60).toFixed(3);
  if (mins > 0) return `${mins}:${rest.padStart(6, "0")}`;
  return rest;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const sqDiffs = values.map(v => (v - avg) ** 2);
  return Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / (values.length - 1));
}

// Hook: List all races for the user
export function useRacesList(filter: RaceFilterType = "all") {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["analyticsRacesList", user?.id, filter],
    queryFn: async (): Promise<RaceOption[]> => {
      if (!user?.id) return [];
      const races: RaceOption[] = [];

      if (filter === "all" || filter === "championship") {
        const { data } = await supabase
          .from("heat_results_public")
          .select("id, created_at, heat_id, position, best_lap_time, heats:heat_id(name, event_id, events:event_id(name, date, track_id, tracks:track_id(name)))")
          .eq("driver_id", user.id)
          .order("created_at", { ascending: false });

        data?.forEach((r: any) => {
          const eventName = r.heats?.events?.name || "Campeonato";
          const heatName = r.heats?.name || "";
          const trackName = r.heats?.events?.tracks?.name || null;
          const date = r.heats?.events?.date || r.created_at;
          races.push({
            id: `champ_${r.id}`,
            label: `${eventName} - ${heatName}`,
            date,
            type: "championship",
            trackName,
          });
        });
      }

      if (filter === "all" || filter === "training" || filter === "standalone") {
        let query = supabase
          .from("standalone_races")
          .select("id, date, track_name, race_type, best_lap_time, notes")
          .eq("user_id", user.id)
          .order("date", { ascending: false });

        if (filter === "training") query = query.eq("race_type", "training");
        else if (filter === "standalone") query = query.eq("race_type", "standalone");

        const { data } = await query;
        data?.forEach((r) => {
          races.push({
            id: `standalone_${r.id}`,
            label: `${r.race_type === "training" ? "Treino" : "Avulsa"} - ${r.track_name || "Sem pista"}`,
            date: r.date,
            type: r.race_type as "training" | "standalone",
            trackName: r.track_name,
          });
        });
      }

      return races.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    },
    enabled: !!user?.id,
  });
}

// Hook: Get lap telemetry for specific races
export function useLapTimesForRaces(raceIds: string[]) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["analyticsLapTimes", raceIds],
    queryFn: async (): Promise<RaceLapData[]> => {
      if (!user?.id || raceIds.length === 0) return [];

      const results: RaceLapData[] = [];

      for (const raceId of raceIds) {
        if (raceId.startsWith("champ_")) {
          const heatResultId = raceId.replace("champ_", "");
          const { data } = await supabase
            .from("lap_telemetry")
            .select("*")
            .eq("heat_result_id", heatResultId)
            .order("lap_number");

          if (data && data.length > 0) {
            const laps = data.map((l) => {
              const time = parseLapTime(l.lap_time) || 0;
              return {
                lap: l.lap_number,
                time,
                timeStr: l.lap_time,
                sector1: parseLapTime(l.sector1) || undefined,
                sector2: parseLapTime(l.sector2) || undefined,
                sector3: parseLapTime(l.sector3) || undefined,
                averageSpeed: l.average_speed ? Number(l.average_speed) : undefined,
                gapToBest: l.gap_to_best || undefined,
                gapToLeader: l.gap_to_leader || undefined,
                kartNumber: l.kart_number || undefined,
                totalTime: l.total_time || undefined,
              };
            });
            const times = laps.map(l => l.time);
            const bestIdx = times.indexOf(Math.min(...times));
            const worstIdx = times.indexOf(Math.max(...times));
            results.push({ raceId, raceLabel: raceId, laps, bestLapIndex: bestIdx, worstLapIndex: worstIdx });
          }
        } else if (raceId.startsWith("standalone_")) {
          const standaloneId = raceId.replace("standalone_", "");
          const { data } = await supabase
            .from("standalone_race_telemetry")
            .select("*")
            .eq("standalone_race_id", standaloneId)
            .order("lap_number");

          if (data && data.length > 0) {
            const laps = data.map((l) => {
              const time = parseLapTime(l.lap_time) || 0;
              return {
                lap: l.lap_number,
                time,
                timeStr: l.lap_time,
                sector1: parseLapTime(l.sector1) || undefined,
                sector2: parseLapTime(l.sector2) || undefined,
                sector3: parseLapTime(l.sector3) || undefined,
                averageSpeed: l.average_speed ? Number(l.average_speed) : undefined,
                gapToBest: l.gap_to_best || undefined,
                gapToLeader: l.gap_to_leader || undefined,
                kartNumber: l.kart_number || undefined,
                totalTime: l.total_time || undefined,
              };
            });
            const times = laps.map(l => l.time);
            const bestIdx = times.indexOf(Math.min(...times));
            const worstIdx = times.indexOf(Math.max(...times));
            results.push({ raceId, raceLabel: raceId, laps, bestLapIndex: bestIdx, worstLapIndex: worstIdx });
          }
        }
      }

      return results;
    },
    enabled: !!user?.id && raceIds.length > 0,
  });
}

// Hook: Best lap evolution over time
export function useBestLapEvolution(filter: RaceFilterType = "all") {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["analyticsBestLapEvolution", user?.id, filter],
    queryFn: async () => {
      if (!user?.id) return [];

      const entries: { date: string; bestLap: number; bestLapStr: string; label: string }[] = [];

      if (filter === "all" || filter === "championship") {
        const { data } = await supabase
          .from("heat_results_public")
          .select("best_lap_time, created_at, heats:heat_id(name, events:event_id(name, date))")
          .eq("driver_id", user.id)
          .not("best_lap_time", "is", null);

        data?.forEach((r: any) => {
          const time = parseLapTime(r.best_lap_time);
          if (time) {
            entries.push({
              date: r.heats?.events?.date || r.created_at,
              bestLap: time,
              bestLapStr: r.best_lap_time,
              label: r.heats?.events?.name || "Campeonato",
            });
          }
        });
      }

      if (filter === "all" || filter === "training" || filter === "standalone") {
        let query = supabase
          .from("standalone_races")
          .select("best_lap_time, date, track_name, race_type")
          .eq("user_id", user.id)
          .not("best_lap_time", "is", null);

        if (filter === "training") query = query.eq("race_type", "training");
        else if (filter === "standalone") query = query.eq("race_type", "standalone");

        const { data } = await query;
        data?.forEach((r) => {
          const time = parseLapTime(r.best_lap_time);
          if (time) {
            entries.push({
              date: r.date,
              bestLap: time,
              bestLapStr: r.best_lap_time!,
              label: r.track_name || (r.race_type === "training" ? "Treino" : "Avulsa"),
            });
          }
        });
      }

      return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },
    enabled: !!user?.id,
  });
}

// Hook: Track comparison
export function useTrackComparison(filter: RaceFilterType = "all") {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["analyticsTrackComparison", user?.id, filter],
    queryFn: async (): Promise<TrackStats[]> => {
      if (!user?.id) return [];

      const trackMap = new Map<string, { times: number[]; count: number }>();

      if (filter === "all" || filter === "training" || filter === "standalone") {
        let query = supabase
          .from("standalone_races")
          .select("best_lap_time, track_name, race_type")
          .eq("user_id", user.id)
          .not("track_name", "is", null);

        if (filter === "training") query = query.eq("race_type", "training");
        else if (filter === "standalone") query = query.eq("race_type", "standalone");

        const { data } = await query;
        data?.forEach((r) => {
          const name = r.track_name!;
          const time = parseLapTime(r.best_lap_time);
          const existing = trackMap.get(name) || { times: [], count: 0 };
          existing.count++;
          if (time) existing.times.push(time);
          trackMap.set(name, existing);
        });
      }

      if (filter === "all" || filter === "championship") {
        const { data } = await supabase
          .from("heat_results_public")
          .select("best_lap_time, heats:heat_id(events:event_id(tracks:track_id(name)))")
          .eq("driver_id", user.id);

        data?.forEach((r: any) => {
          const name = r.heats?.events?.tracks?.name;
          if (!name) return;
          const time = parseLapTime(r.best_lap_time);
          const existing = trackMap.get(name) || { times: [], count: 0 };
          existing.count++;
          if (time) existing.times.push(time);
          trackMap.set(name, existing);
        });
      }

      return Array.from(trackMap.entries())
        .map(([trackName, { times, count }]) => {
          const best = times.length > 0 ? Math.min(...times) : 0;
          const avg = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
          return {
            trackName,
            totalRaces: count,
            bestLap: best,
            bestLapStr: best > 0 ? formatSeconds(best) : "-",
            avgLap: avg,
            avgLapStr: avg > 0 ? formatSeconds(avg) : "-",
          };
        })
        .sort((a, b) => b.totalRaces - a.totalRaces);
    },
    enabled: !!user?.id,
  });
}

// Hook: Consistency data
export function useConsistencyData(raceIds: string[]) {
  const lapData = useLapTimesForRaces(raceIds);

  const data = (lapData.data || []).map((race) => {
    const times = race.laps.map(l => l.time).filter(t => t > 0);
    return {
      raceLabel: race.raceLabel,
      stdDev: stdDev(times),
      avgTime: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
      lapsCount: times.length,
    };
  });

  return { data, isLoading: lapData.isLoading };
}

// Hook: Head-to-head (expanded)
export function useHeadToHead(driverId1: string | undefined, driverId2: string | undefined) {
  return useQuery({
    queryKey: ["analyticsHeadToHead", driverId1, driverId2],
    queryFn: async (): Promise<HeadToHeadResult | null> => {
      if (!driverId1 || !driverId2) return null;

      // Fetch results with best_lap_time, average_speed, and track info
      const [{ data: d1Results }, { data: d2Results }] = await Promise.all([
        supabase.from("heat_results_public").select("id, heat_id, position, points, best_lap_time, average_speed, heats:heat_id(name, event_id, events:event_id(name, date, track_id, tracks:track_id(name)))").eq("driver_id", driverId1),
        supabase.from("heat_results_public").select("id, heat_id, position, points, best_lap_time, average_speed, heats:heat_id(name, event_id, events:event_id(name, date, track_id, tracks:track_id(name)))").eq("driver_id", driverId2),
      ]);

      if (!d1Results || !d2Results) return null;

      const d1HeatMap = new Map(d1Results.map((r: any) => [r.heat_id, r]));
      const d2HeatMap = new Map(d2Results.map((r: any) => [r.heat_id, r]));
      const commonHeatIds = [...d1HeatMap.keys()].filter(h => h && d2HeatMap.has(h));

      if (commonHeatIds.length === 0) return null;

      // Build common heats list with labels
      const commonHeats: H2HCommonHeat[] = commonHeatIds.map(hId => {
        const r: any = d1HeatMap.get(hId);
        const eventName = r?.heats?.events?.name || "Evento";
        const heatName = r?.heats?.name || "";
        return { heatId: hId!, label: `${eventName} - ${heatName}` };
      });

      // Get profile names
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, username")
        .in("id", [driverId1, driverId2]);

      const getName = (id: string) => {
        const p = profiles?.find(pr => pr.id === id);
        return p?.full_name || p?.username || "Piloto";
      };

      // Fetch lap telemetry for both drivers in common heats
      const d1HeatResultIds = commonHeatIds.map(h => d1HeatMap.get(h)?.id).filter(Boolean) as string[];
      const d2HeatResultIds = commonHeatIds.map(h => d2HeatMap.get(h)?.id).filter(Boolean) as string[];

      const [{ data: d1Telemetry }, { data: d2Telemetry }] = await Promise.all([
        d1HeatResultIds.length > 0
          ? supabase.from("lap_telemetry").select("heat_result_id, lap_number, lap_time").in("heat_result_id", d1HeatResultIds).order("lap_number")
          : Promise.resolve({ data: [] as any[] }),
        d2HeatResultIds.length > 0
          ? supabase.from("lap_telemetry").select("heat_result_id, lap_number, lap_time").in("heat_result_id", d2HeatResultIds).order("lap_number")
          : Promise.resolve({ data: [] as any[] }),
      ]);

      // Build telemetry map by heat
      const heatResultToHeat1 = new Map(commonHeatIds.map(h => [d1HeatMap.get(h)?.id, h]));
      const heatResultToHeat2 = new Map(commonHeatIds.map(h => [d2HeatMap.get(h)?.id, h]));

      const lapTelemetryByHeat = new Map<string, { driver1: H2HLapTelemetry[]; driver2: H2HLapTelemetry[] }>();
      commonHeatIds.forEach(h => lapTelemetryByHeat.set(h!, { driver1: [], driver2: [] }));

      (d1Telemetry || []).forEach((t: any) => {
        const heatId = heatResultToHeat1.get(t.heat_result_id);
        if (heatId) {
          const time = parseLapTime(t.lap_time);
          if (time) lapTelemetryByHeat.get(heatId)!.driver1.push({ lap: t.lap_number, time, timeStr: t.lap_time });
        }
      });
      (d2Telemetry || []).forEach((t: any) => {
        const heatId = heatResultToHeat2.get(t.heat_result_id);
        if (heatId) {
          const time = parseLapTime(t.lap_time);
          if (time) lapTelemetryByHeat.get(heatId)!.driver2.push({ lap: t.lap_number, time, timeStr: t.lap_time });
        }
      });

      // Build stats for each driver
      const buildStats = (
        results: Map<string | null, any>,
        heats: string[],
        name: string,
        id: string,
        isDriver1: boolean,
      ): HeadToHeadStats => {
        let wins = 0, podiums = 0, totalPoints = 0, posSum = 0, posCount = 0, best = 999;
        const bestLapsByTrackMap = new Map<string, number>();
        const avgSpeeds: H2HAvgSpeedByHeat[] = [];
        const bestLapTimes: number[] = [];
        const speedValues: number[] = [];
        const consistencyByHeat: { heatId: string; label: string; stdDev: number }[] = [];

        heats.forEach(h => {
          const r = results.get(h);
          if (!r) return;
          if (r.position != null) {
            if (r.position === 1) wins++;
            if (r.position <= 3) podiums++;
            totalPoints += r.points || 0;
            posSum += r.position;
            posCount++;
            if (r.position < best) best = r.position;
          }
          // Best lap by track
          const trackName = r.heats?.events?.tracks?.name;
          const lapTime = parseLapTime(r.best_lap_time);
          if (trackName && lapTime) {
            const existing = bestLapsByTrackMap.get(trackName);
            if (!existing || lapTime < existing) bestLapsByTrackMap.set(trackName, lapTime);
            bestLapTimes.push(lapTime);
          }
          // Avg speed
          const speed = r.average_speed ? Number(r.average_speed) : null;
          const heatLabel = commonHeats.find(ch => ch.heatId === h)?.label || h;
          if (speed) {
            avgSpeeds.push({ heatId: h, heatLabel, avgSpeed: speed });
            speedValues.push(speed);
          }
          // Consistency from telemetry
          const telemetry = lapTelemetryByHeat.get(h);
          const driverLaps = isDriver1 ? telemetry?.driver1 : telemetry?.driver2;
          if (driverLaps && driverLaps.length >= 2) {
            const times = driverLaps.map(l => l.time);
            consistencyByHeat.push({ heatId: h, label: heatLabel, stdDev: Math.round(stdDev(times) * 1000) / 1000 });
          }
        });

        const bestLapsByTrack: H2HBestLapByTrack[] = Array.from(bestLapsByTrackMap.entries()).map(([trackName, lapTime]) => ({
          trackName,
          lapTime,
          lapTimeStr: formatSeconds(lapTime),
        }));

        return {
          driverName: name, driverId: id,
          wins, podiums,
          avgPosition: posCount > 0 ? Math.round((posSum / posCount) * 10) / 10 : 0,
          totalPoints, races: commonHeats.length,
          bestPosition: best < 999 ? best : 0,
          bestLapsByTrack,
          avgSpeeds,
          avgBestLap: bestLapTimes.length > 0 ? bestLapTimes.reduce((a, b) => a + b, 0) / bestLapTimes.length : null,
          avgSpeedOverall: speedValues.length > 0 ? Math.round((speedValues.reduce((a, b) => a + b, 0) / speedValues.length) * 10) / 10 : null,
          consistencyByHeat,
        };
      };

      return {
        driver1: buildStats(d1HeatMap, commonHeatIds as string[], getName(driverId1), driverId1, true),
        driver2: buildStats(d2HeatMap, commonHeatIds as string[], getName(driverId2), driverId2, false),
        commonHeats,
        lapTelemetryByHeat,
      };
    },
    enabled: !!driverId1 && !!driverId2 && driverId1 !== driverId2,
  });
}

// Hook: KPIs
export interface AnalyticsKPIs {
  bestLapAllTime: string | null;
  bestLapTime: number | null;
  favoriteTrack: string | null;
  favoriteTrackCount: number;
  podiumRate: number;
  consistencyScore: number | null;
  totalRaces: number;
}

export function useAnalyticsKPIs(filter: RaceFilterType = "all") {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["analyticsKPIs", user?.id, filter],
    queryFn: async (): Promise<AnalyticsKPIs> => {
      if (!user?.id) return { bestLapAllTime: null, bestLapTime: null, favoriteTrack: null, favoriteTrackCount: 0, podiumRate: 0, consistencyScore: null, totalRaces: 0 };

      let allBestLaps: number[] = [];
      let allPositions: number[] = [];
      const trackCounts = new Map<string, number>();
      let totalRaces = 0;

      if (filter === "all" || filter === "championship") {
        const { data } = await supabase
          .from("heat_results_public")
          .select("best_lap_time, position, heats:heat_id(events:event_id(tracks:track_id(name)))")
          .eq("driver_id", user.id);

        data?.forEach((r: any) => {
          totalRaces++;
          const t = parseLapTime(r.best_lap_time);
          if (t) allBestLaps.push(t);
          if (r.position) allPositions.push(r.position);
          const tn = r.heats?.events?.tracks?.name;
          if (tn) trackCounts.set(tn, (trackCounts.get(tn) || 0) + 1);
        });
      }

      if (filter === "all" || filter === "training" || filter === "standalone") {
        let query = supabase.from("standalone_races").select("best_lap_time, position, track_name, race_type").eq("user_id", user.id);
        if (filter === "training") query = query.eq("race_type", "training");
        else if (filter === "standalone") query = query.eq("race_type", "standalone");
        const { data } = await query;
        data?.forEach((r) => {
          totalRaces++;
          const t = parseLapTime(r.best_lap_time);
          if (t) allBestLaps.push(t);
          if (r.position) allPositions.push(r.position);
          if (r.track_name) trackCounts.set(r.track_name, (trackCounts.get(r.track_name) || 0) + 1);
        });
      }

      const bestTime = allBestLaps.length > 0 ? Math.min(...allBestLaps) : null;
      const podiums = allPositions.filter(p => p <= 3).length;
      let favoriteTrack: string | null = null;
      let favoriteTrackCount = 0;
      trackCounts.forEach((count, name) => {
        if (count > favoriteTrackCount) { favoriteTrack = name; favoriteTrackCount = count; }
      });

      return {
        bestLapAllTime: bestTime ? formatSeconds(bestTime) : null,
        bestLapTime: bestTime,
        favoriteTrack,
        favoriteTrackCount,
        podiumRate: totalRaces > 0 ? Math.round((podiums / totalRaces) * 100) : 0,
        consistencyScore: allPositions.length >= 2 ? Math.round(stdDev(allPositions) * 100) / 100 : null,
        totalRaces,
      };
    },
    enabled: !!user?.id,
  });
}
