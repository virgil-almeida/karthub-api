import { getRecentEvents, mockHeatResults, mockHeats, mockProfiles } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Calendar, MapPin, Trophy, Timer } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function RecentRaces() {
  const { t } = useTranslation();
  const recentEvents = getRecentEvents(3);

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-racing text-lg font-bold">{t("dashboard.recentRaces")}</h2>
        <Link
          to="/races"
          className="text-sm text-racing-cyan hover:text-racing-cyan/80 transition-colors"
        >
          {t("dashboard.viewAll")}
        </Link>
      </div>

      <div className="space-y-4">
        {recentEvents.map((event, index) => {
          const eventHeats = mockHeats.filter(h => h.event_id === event.id);
          const finalHeat = eventHeats.find(h => h.name.toLowerCase().includes('final')) || eventHeats[0];
          const heatResults = finalHeat 
            ? mockHeatResults.filter(r => r.heat_id === finalHeat.id).sort((a, b) => a.position - b.position)
            : [];
          const winner = heatResults[0];
          const winnerProfile = winner?.driver_id 
            ? mockProfiles.find(p => p.id === winner.driver_id)
            : null;

          return (
            <Link
              key={event.id}
              to={`/races/${event.id}`}
              className={cn(
                "block p-4 rounded-lg border border-border bg-muted/30 hover:border-primary/50 transition-all duration-200 group",
                index === 0 && "border-primary/30"
              )}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {event.name}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(event.date), "dd MMM yyyy", { locale: ptBR })}
                    </span>
                    {event.track && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.track.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">
                    {heatResults.length > 0 ? `${heatResults[0]?.total_laps || 0} ${t("common.laps").toLowerCase()}` : ""}
                  </span>
                </div>
              </div>

              {winner && (
                <div className="flex items-center gap-3 pt-3 border-t border-border">
                  <Trophy className="w-4 h-4 text-racing-yellow" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-foreground">
                      {winnerProfile?.full_name || winner.driver_name_text || t("h2h.driver")}
                    </span>
                    {winner.kart_number && (
                      <span className="text-xs text-muted-foreground ml-2">
                        #{winner.kart_number}
                      </span>
                    )}
                  </div>
                  {winner.best_lap_time && (
                    <div className="flex items-center gap-1 text-racing-cyan">
                      <Timer className="w-3 h-3" />
                      <span className="text-sm font-mono">{winner.best_lap_time}</span>
                    </div>
                  )}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}