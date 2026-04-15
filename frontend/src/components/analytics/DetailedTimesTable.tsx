import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Timer } from "lucide-react";
import type { RaceLapData } from "@/hooks/useAnalyticsData";
import { formatSeconds } from "@/hooks/useAnalyticsData";
import { cn } from "@/lib/utils";
import { useTranslation } from "react-i18next";

interface DetailedTimesTableProps {
  racesData: RaceLapData[];
  raceLabels?: Map<string, string>;
  isLoading?: boolean;
}

export function DetailedTimesTable({ racesData, raceLabels, isLoading }: DetailedTimesTableProps) {
  const { t } = useTranslation();

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  const race = racesData[0];
  if (!race || race.laps.length === 0) {
    return (
      <div className="stat-card">
        <div className="flex items-center gap-2 mb-4">
          <Timer className="w-5 h-5 text-racing-cyan" />
          <h2 className="font-racing text-lg font-bold">{t("analytics.detailedTimesTable")}</h2>
        </div>
        <div className="h-40 flex flex-col items-center justify-center text-muted-foreground">
          <Timer className="w-10 h-10 mb-2 opacity-50" />
          <p className="text-sm">{t("analytics.selectRaceWithTelemetry")}</p>
        </div>
      </div>
    );
  }

  const hasSectors = race.laps.some(l => l.sector1 || l.sector2 || l.sector3);
  const hasSpeed = race.laps.some(l => l.averageSpeed);

  return (
    <div className="stat-card">
      <div className="flex items-center gap-2 mb-4">
        <Timer className="w-5 h-5 text-racing-cyan" />
        <h2 className="font-racing text-lg font-bold">{t("analytics.detailedTimesTable")}</h2>
        {raceLabels?.get(race.raceId) && (
          <span className="text-xs text-muted-foreground ml-2">— {raceLabels.get(race.raceId)}</span>
        )}
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="font-racing text-xs w-14">VLT</TableHead>
              <TableHead className="font-racing text-xs">TV</TableHead>
              <TableHead className="font-racing text-xs">DMV</TableHead>
              <TableHead className="font-racing text-xs">DL</TableHead>
              {hasSpeed && <TableHead className="font-racing text-xs">VM</TableHead>}
              {hasSectors && <>
                <TableHead className="font-racing text-xs">S1</TableHead>
                <TableHead className="font-racing text-xs">S2</TableHead>
                <TableHead className="font-racing text-xs">S3</TableHead>
              </>}
              {race.laps.some(l => l.kartNumber) && <TableHead className="font-racing text-xs">Kart</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {race.laps.map((lap, idx) => {
              const isBest = idx === race.bestLapIndex;
              const isWorst = idx === race.worstLapIndex && race.laps.length > 2;
              return (
                <TableRow key={lap.lap} className={cn("border-border", isBest && "bg-racing-green/10", isWorst && "bg-destructive/10")}>
                  <TableCell className="font-mono text-xs font-bold">{lap.lap}</TableCell>
                  <TableCell className={cn("font-mono text-xs tabular-nums", isBest && "text-racing-cyan font-bold best-lap")}>
                    {lap.timeStr}
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                    {lap.gapToBest || "-"}
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                    {lap.gapToLeader || "-"}
                  </TableCell>
                  {hasSpeed && (
                    <TableCell className="font-mono text-xs tabular-nums">{lap.averageSpeed?.toFixed(1) || "-"}</TableCell>
                  )}
                  {hasSectors && <>
                    <TableCell className="font-mono text-xs tabular-nums">{lap.sector1 ? formatSeconds(lap.sector1) : "-"}</TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">{lap.sector2 ? formatSeconds(lap.sector2) : "-"}</TableCell>
                    <TableCell className="font-mono text-xs tabular-nums">{lap.sector3 ? formatSeconds(lap.sector3) : "-"}</TableCell>
                  </>}
                  {race.laps.some(l => l.kartNumber) && (
                    <TableCell className="font-mono text-xs">{lap.kartNumber || "-"}</TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="flex gap-4 mt-3 text-[10px]">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-racing-green" /> {t("analytics.bestLapLegend")}</span>
        {race.laps.length > 2 && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-destructive" /> {t("analytics.worstLapLegend")}</span>}
        <span className="text-muted-foreground">{t("analytics.legendVLT")}</span>
      </div>
    </div>
  );
}