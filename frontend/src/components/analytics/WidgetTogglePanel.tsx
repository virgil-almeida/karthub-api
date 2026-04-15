import { Settings2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

export interface WidgetPreferences {
  kpis: boolean;
  positionEvolution: boolean;
  lapTimeEvolution: boolean;
  bestLapEvolution: boolean;
  consistency: boolean;
  sectorAnalysis: boolean;
  trackComparison: boolean;
  detailedTimes: boolean;
  headToHead: boolean;
}

export const defaultWidgetPreferences: WidgetPreferences = {
  kpis: true,
  positionEvolution: true,
  lapTimeEvolution: true,
  bestLapEvolution: true,
  consistency: true,
  sectorAnalysis: true,
  trackComparison: true,
  detailedTimes: true,
  headToHead: true,
};

const widgetLabelKeys: Record<keyof WidgetPreferences, string> = {
  kpis: "analytics.kpisSummary",
  positionEvolution: "analytics.positionEvolution",
  lapTimeEvolution: "analytics.lapTimesWidget",
  bestLapEvolution: "analytics.bestLapWidget",
  consistency: "analytics.consistencyWidget",
  sectorAnalysis: "analytics.sectorWidget",
  trackComparison: "analytics.trackWidget",
  detailedTimes: "analytics.detailedWidget",
  headToHead: "analytics.headToHeadWidget",
};

interface WidgetTogglePanelProps {
  preferences: WidgetPreferences;
  onChange: (prefs: WidgetPreferences) => void;
}

export function WidgetTogglePanel({ preferences, onChange }: WidgetTogglePanelProps) {
  const { t } = useTranslation();

  const toggle = (key: keyof WidgetPreferences) => {
    onChange({ ...preferences, [key]: !preferences[key] });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings2 className="w-4 h-4" />
          {t("analytics.widgets")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="end">
        <div className="space-y-3">
          <p className="font-racing text-sm font-bold text-foreground">{t("analytics.visibleModules")}</p>
          {(Object.keys(widgetLabelKeys) as (keyof WidgetPreferences)[]).map((key) => (
            <div key={key} className="flex items-center justify-between">
              <Label htmlFor={`widget-${key}`} className="text-xs text-muted-foreground cursor-pointer">
                {t(widgetLabelKeys[key])}
              </Label>
              <Switch
                id={`widget-${key}`}
                checked={preferences[key]}
                onCheckedChange={() => toggle(key)}
              />
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}