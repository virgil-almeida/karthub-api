import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Layers, Target, GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RaceOption } from "@/hooks/useAnalyticsData";
import { useTranslation } from "react-i18next";

export type SelectionMode = "all" | "single" | "compare";

interface RaceSelectorProps {
  races: RaceOption[];
  mode: SelectionMode;
  onModeChange: (mode: SelectionMode) => void;
  selectedRaces: string[];
  onSelectedChange: (ids: string[]) => void;
  isLoading?: boolean;
}

const typeColors: Record<string, string> = {
  championship: "bg-racing-cyan/20 text-racing-cyan border-racing-cyan/30",
  training: "bg-racing-yellow/20 text-racing-yellow border-racing-yellow/30",
  standalone: "bg-racing-green/20 text-racing-green border-racing-green/30",
};

export function RaceSelector({ races, mode, onModeChange, selectedRaces, onSelectedChange, isLoading }: RaceSelectorProps) {
  const { t } = useTranslation();

  const handleModeChange = (newMode: string) => {
    onModeChange(newMode as SelectionMode);
    if (newMode === "all") onSelectedChange([]);
  };

  const handleRaceSelect = (raceId: string) => {
    if (mode === "single") {
      onSelectedChange([raceId]);
    } else if (mode === "compare") {
      if (selectedRaces.includes(raceId)) {
        onSelectedChange(selectedRaces.filter(id => id !== raceId));
      } else if (selectedRaces.length < 3) {
        onSelectedChange([...selectedRaces, raceId]);
      }
    }
  };

  const removeRace = (raceId: string) => {
    onSelectedChange(selectedRaces.filter(id => id !== raceId));
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Select value={mode} onValueChange={handleModeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            <span className="flex items-center gap-2"><Layers className="w-3.5 h-3.5" /> {t("analytics.allRaces")}</span>
          </SelectItem>
          <SelectItem value="single">
            <span className="flex items-center gap-2"><Target className="w-3.5 h-3.5" /> {t("analytics.specificRace")}</span>
          </SelectItem>
          <SelectItem value="compare">
            <span className="flex items-center gap-2"><GitCompare className="w-3.5 h-3.5" /> {t("analytics.compareRaces")}</span>
          </SelectItem>
        </SelectContent>
      </Select>

      {mode !== "all" && (
        <Select
          value={mode === "single" ? (selectedRaces[0] || "") : ""}
          onValueChange={handleRaceSelect}
        >
          <SelectTrigger className="flex-1 min-w-[250px]">
            <SelectValue placeholder={mode === "compare" ? t("analytics.selectUpTo3") : t("analytics.selectOneRace")} />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {isLoading ? (
              <SelectItem value="loading" disabled>{t("common.loading")}</SelectItem>
            ) : races.length === 0 ? (
              <SelectItem value="empty" disabled>{t("analytics.noRacesFound")}</SelectItem>
            ) : (
              races.map((race) => (
                <SelectItem key={race.id} value={race.id}>
                  <span className="flex items-center gap-2 text-xs">
                    <span className={`inline-block w-2 h-2 rounded-full ${race.type === "championship" ? "bg-racing-cyan" : race.type === "training" ? "bg-racing-yellow" : "bg-racing-green"}`} />
                    {race.label}
                    <span className="text-muted-foreground ml-1">{new Date(race.date).toLocaleDateString("pt-BR")}</span>
                  </span>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      )}

      {mode === "compare" && selectedRaces.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedRaces.map((id) => {
            const race = races.find(r => r.id === id);
            return (
              <Badge key={id} variant="outline" className={`text-xs gap-1 ${typeColors[race?.type || "standalone"]}`}>
                {race?.label.substring(0, 20) || id}
                <button onClick={() => removeRace(id)}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}