import { useState } from "react";
import { useStandaloneRaces, useDeleteStandaloneRace } from "@/hooks/useStandaloneRaces";
import { useStandaloneRaceTelemetry } from "@/hooks/useStandaloneRaceTelemetry";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Trash2, Timer, Gauge, MapPin, Flag, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StandaloneRaceTelemetryPanel } from "./StandaloneRaceTelemetryPanel";
import { useTranslation } from "react-i18next";

function TelemetryCount({ raceId }: { raceId: string }) {
  const { t } = useTranslation();
  const { data } = useStandaloneRaceTelemetry(raceId);
  if (!data?.length) return null;
  return (
    <span className="text-xs text-muted-foreground">({data.length} {t("common.laps").toLowerCase()})</span>
  );
}

export function StandaloneRacesList() {
  const { t } = useTranslation();
  const { data: races, isLoading } = useStandaloneRaces();
  const deleteRace = useDeleteStandaloneRace();
  const [expandedRaceId, setExpandedRaceId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!races || races.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Flag className="w-10 h-10 mx-auto mb-3 opacity-50" />
        <p className="text-sm">{t("standaloneRace.noRaces")}</p>
        <p className="text-xs">{t("standaloneRace.useButtonAbove")}</p>
      </div>
    );
  }

  const toggleExpand = (raceId: string) => {
    setExpandedRaceId(prev => prev === raceId ? null : raceId);
  };

  return (
    <div className="space-y-3">
      {races.map((race) => (
        <div
          key={race.id}
          className="p-4 rounded-lg border border-border bg-muted/30 hover:border-primary/30 transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge variant={race.race_type === "training" ? "secondary" : "default"} className="text-xs">
                {race.race_type === "training" ? t("standaloneRace.training") : t("standaloneRace.standalone")}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {format(new Date(race.date), "dd MMM yyyy", { locale: ptBR })}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => toggleExpand(race.id)}
              >
                <Timer className="w-3.5 h-3.5" />
                {t("standaloneRace.telemetry")}
                <TelemetryCount raceId={race.id} />
                {expandedRaceId === race.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => deleteRace.mutate(race.id)}
                disabled={deleteRace.isPending}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>

          {race.track_name && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>{race.track_name}</span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {race.position && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">{t("standaloneRace.position")}</span>
                <span className="font-mono font-bold text-primary">P{race.position}</span>
              </div>
            )}
            {race.kart_number && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">#Kart:</span>
                <span className="font-mono font-bold">{race.kart_number}</span>
              </div>
            )}
            {race.best_lap_time && (
              <div className="flex items-center gap-1.5">
                <Timer className="w-3 h-3 text-racing-cyan" />
                <span className="font-mono">{race.best_lap_time}</span>
              </div>
            )}
            {race.average_speed && (
              <div className="flex items-center gap-1.5">
                <Gauge className="w-3 h-3 text-racing-green" />
                <span className="font-mono">{race.average_speed} km/h</span>
              </div>
            )}
            {race.total_laps && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">{t("standaloneRace.lapsLabel")}</span>
                <span className="font-mono">{race.total_laps}</span>
              </div>
            )}
            {race.total_time && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">TT:</span>
                <span className="font-mono">{race.total_time}</span>
              </div>
            )}
          </div>

          {race.notes && (
            <p className="text-xs text-muted-foreground mt-2 italic">{race.notes}</p>
          )}

          {expandedRaceId === race.id && (
            <StandaloneRaceTelemetryPanel
              raceId={race.id}
              totalLaps={race.total_laps}
              kartNumber={race.kart_number}
            />
          )}
        </div>
      ))}
    </div>
  );
}