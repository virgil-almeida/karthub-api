import { Calendar, MapPin, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import type { Event } from "@/types/kart";
import { useTranslation } from "react-i18next";

interface UpcomingEventsProps {
  events: Event[];
}

export function UpcomingEvents({ events }: UpcomingEventsProps) {
  const { t } = useTranslation();

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-racing-cyan" />
          <h3 className="font-racing text-lg font-bold">{t("dashboard.upcomingEvents")}</h3>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p className="text-sm">{t("dashboard.noEventsScheduledShort")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <span className="font-racing text-sm text-primary font-bold">
                  {format(new Date(event.date), "dd")}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{event.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{format(new Date(event.date), "MMM", { locale: ptBR })}</span>
                  {event.track && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {event.track.name}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          ))}
        </div>
      )}

      <Link to="/championships" className="block mt-4">
        <Button variant="ghost" size="sm" className="w-full text-racing-cyan hover:text-racing-cyan/80">
          {t("dashboard.viewAllChampionships")}
        </Button>
      </Link>
    </div>
  );
}