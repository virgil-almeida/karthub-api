import { mockEvents, mockHeatResults, getProfileById } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, MapPin, Trophy, Timer, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Races() {
  const sortedEvents = [...mockEvents].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-racing text-3xl font-bold text-gradient-racing">
            ETAPAS
          </h1>
          <p className="text-muted-foreground mt-1">
            {mockEvents.length} etapas no campeonato
          </p>
        </div>
        <Button className="w-fit bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4 mr-2" />
          Nova Etapa
        </Button>
      </div>

      <div className="space-y-4">
        {sortedEvents.map((event, index) => {
          const isCompleted = event.status === 'completed';
          
          return (
            <div
              key={event.id}
              className={cn(
                "stat-card hover:border-primary/50 transition-all duration-200",
                index === 0 && isCompleted && "border-primary/30"
              )}
            >
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {!isCompleted && (
                      <span className="px-2 py-1 text-xs font-medium bg-racing-cyan/20 text-racing-cyan rounded">
                        Próxima
                      </span>
                    )}
                    <h3 className="font-racing text-xl font-bold">
                      {event.name}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(event.date), "dd MMMM yyyy", { locale: ptBR })}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {event.track?.name}
                    </span>
                    <span className={cn(
                      "px-2 py-0.5 rounded text-xs",
                      isCompleted ? "bg-racing-green/20 text-racing-green" : "bg-muted"
                    )}>
                      {isCompleted ? "Finalizado" : "Agendado"}
                    </span>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
