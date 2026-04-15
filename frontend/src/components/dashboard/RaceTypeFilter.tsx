import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Trophy, Dumbbell, Shuffle } from "lucide-react";

export type RaceFilterType = "all" | "championship" | "training" | "standalone";

interface RaceTypeFilterProps {
  value: RaceFilterType;
  onChange: (value: RaceFilterType) => void;
}

export function RaceTypeFilter({ value, onChange }: RaceTypeFilterProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => v && onChange(v as RaceFilterType)}
      className="justify-start"
    >
      <ToggleGroupItem value="all" className="text-xs gap-1.5 data-[state=on]:bg-primary/20 data-[state=on]:text-primary">
        Todas
      </ToggleGroupItem>
      <ToggleGroupItem value="championship" className="text-xs gap-1.5 data-[state=on]:bg-racing-cyan/20 data-[state=on]:text-racing-cyan">
        <Trophy className="w-3.5 h-3.5" />
        Campeonato
      </ToggleGroupItem>
      <ToggleGroupItem value="training" className="text-xs gap-1.5 data-[state=on]:bg-racing-yellow/20 data-[state=on]:text-racing-yellow">
        <Dumbbell className="w-3.5 h-3.5" />
        Treino
      </ToggleGroupItem>
      <ToggleGroupItem value="standalone" className="text-xs gap-1.5 data-[state=on]:bg-racing-green/20 data-[state=on]:text-racing-green">
        <Shuffle className="w-3.5 h-3.5" />
        Avulsa
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
