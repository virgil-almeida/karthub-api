import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { createUserFriendlyError } from "@/lib/errorHandler";
import type { DriverStats, DriverBadge } from "@/types/kart";
import type { RaceFilterType } from "@/components/dashboard/RaceTypeFilter";

export function useDriverStats(profileId: string | undefined, filter: RaceFilterType = "all") {
  return useQuery({
    queryKey: ["driverStats", profileId, filter],
    queryFn: async (): Promise<DriverStats> => {
      if (!profileId) {
        return { totalRaces: 0, wins: 0, podiums: 0, bestPosition: null, averagePosition: 0, totalPoints: 0, fastestLaps: 0 };
      }

      let championshipResults: { position: number; points: number; best_lap_time: string | null }[] = [];
      let standaloneResults: { position: number | null; points: number; best_lap_time: string | null }[] = [];

      // Fetch championship results
      if (filter === "all" || filter === "championship") {
        const { data, error } = await supabase
          .from("heat_results_public")
          .select("position, points, best_lap_time")
          .eq("driver_id", profileId);
        if (error) throw createUserFriendlyError(error);
        championshipResults = (data || []).map(r => ({
          position: r.position!,
          points: r.points || 0,
          best_lap_time: r.best_lap_time,
        }));
      }

      // Fetch standalone/training results
      if (filter === "all" || filter === "training" || filter === "standalone") {
        let query = supabase
          .from("standalone_races")
          .select("position, points, best_lap_time")
          .eq("user_id", profileId);

        if (filter === "training") query = query.eq("race_type", "training");
        else if (filter === "standalone") query = query.eq("race_type", "standalone");

        const { data, error } = await query;
        if (error) throw createUserFriendlyError(error);
        standaloneResults = (data || []).map(r => ({
          position: r.position,
          points: r.points || 0,
          best_lap_time: r.best_lap_time,
        }));
      }

      // Combine
      const allPositions = [
        ...(filter !== "training" && filter !== "standalone" ? championshipResults.map(r => r.position) : []),
        ...standaloneResults.filter(r => r.position != null).map(r => r.position!),
      ];

      const allPoints = [
        ...(filter !== "training" && filter !== "standalone" ? championshipResults.map(r => r.points) : []),
        ...standaloneResults.map(r => r.points),
      ];

      const totalRaces = (filter !== "training" && filter !== "standalone" ? championshipResults.length : 0) + standaloneResults.length;

      if (totalRaces === 0) {
        return { totalRaces: 0, wins: 0, podiums: 0, bestPosition: null, averagePosition: 0, totalPoints: 0, fastestLaps: 0 };
      }

      const wins = allPositions.filter(p => p === 1).length;
      const podiums = allPositions.filter(p => p <= 3).length;
      const totalPoints = allPoints.reduce((sum, p) => sum + p, 0);
      const bestPosition = allPositions.length > 0 ? Math.min(...allPositions) : null;
      const averagePosition = allPositions.length > 0
        ? parseFloat((allPositions.reduce((a, b) => a + b, 0) / allPositions.length).toFixed(1))
        : 0;

      return { totalRaces, wins, podiums, bestPosition, averagePosition, totalPoints, fastestLaps: wins };
    },
    enabled: !!profileId,
  });
}

export function useDriverBadges(profileId: string | undefined) {
  return useQuery({
    queryKey: ["driverBadges", profileId],
    queryFn: async () => {
      if (!profileId) return [];
      const { data, error } = await supabase
        .from("driver_badges")
        .select("*")
        .eq("profile_id", profileId)
        .order("earned_at", { ascending: false });
      if (error) throw createUserFriendlyError(error);
      return data as DriverBadge[];
    },
    enabled: !!profileId,
  });
}

export function useLeaderboard(championshipId?: string) {
  return useQuery({
    queryKey: ["leaderboard", championshipId],
    queryFn: async () => {
      let query = supabase
        .from("heat_results_public")
        .select(`driver_id, position, points, heat:heats(event:events(championship_id))`)
        .not("driver_id", "is", null);

      const { data: results, error: resultsError } = await query;
      if (resultsError) throw createUserFriendlyError(resultsError);

      let filteredResults = results;
      if (championshipId) {
        filteredResults = results.filter(
          (r) => r.heat?.event?.championship_id === championshipId
        );
      }

      const driverMap = new Map<string, { totalPoints: number; wins: number; podiums: number; races: number }>();

      filteredResults.forEach((result) => {
        if (!result.driver_id) return;
        const existing = driverMap.get(result.driver_id) || { totalPoints: 0, wins: 0, podiums: 0, races: 0 };
        driverMap.set(result.driver_id, {
          totalPoints: existing.totalPoints + (result.points || 0),
          wins: existing.wins + (result.position === 1 ? 1 : 0),
          podiums: existing.podiums + (result.position <= 3 ? 1 : 0),
          races: existing.races + 1,
        });
      });

      const driverIds = Array.from(driverMap.keys());
      if (driverIds.length === 0) return [];

      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", driverIds);

      if (profilesError) throw createUserFriendlyError(profilesError);

      const leaderboard = profiles.map((profile) => ({
        ...profile,
        stats: driverMap.get(profile.id) || { totalPoints: 0, wins: 0, podiums: 0, races: 0 },
      }));

      return leaderboard.sort((a, b) =>
        b.stats.totalPoints - a.stats.totalPoints
        || b.stats.wins - a.stats.wins
        || b.stats.podiums - a.stats.podiums
        || b.stats.races - a.stats.races
      );
    },
  });
}
