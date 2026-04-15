import { useParams, Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent, useHeats, useHeatResults } from "@/hooks/useEvents";
import { useChampionshipMembers, useChampionship } from "@/hooks/useChampionships";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { OrganizerResultsPanel } from "@/components/event/OrganizerResultsPanel";
import { DriverTelemetryPanel } from "@/components/event/DriverTelemetryPanel";
import { CreateHeatDialog } from "@/components/event/CreateHeatDialog";
import { ArrowLeft, Calendar, MapPin, Trophy, Flag, Clock, Users, Timer, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState, useMemo } from "react";
import type { HeatResult } from "@/types/kart";

export default function EventDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [selectedHeatId, setSelectedHeatId] = useState<string | null>(null);
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);
  const { data: event, isLoading } = useEvent(id);
  const { data: heats } = useHeats(id);
  const { data: heatResults } = useHeatResults(selectedHeatId || undefined);
  const { data: championship } = useChampionship(event?.championship_id);
  const { data: members } = useChampionshipMembers(event?.championship_id);
  const isOrganizer = useMemo(() => user?.id === championship?.organizer_id, [user?.id, championship?.organizer_id]);
  const userResult = useMemo(() => heatResults?.find(r => r.driver_id === user?.id), [heatResults, user?.id]);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!event) return <Navigate to="/events" replace />;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge variant="secondary" className="bg-racing-green/20 text-racing-green border-0">{t("events.completed")}</Badge>;
      case "in_progress": return <Badge variant="secondary" className="bg-racing-yellow/20 text-racing-yellow border-0">{t("events.inProgress")}</Badge>;
      case "cancelled": return <Badge variant="destructive">{t("events.cancelled")}</Badge>;
      default: return <Badge variant="secondary" className="bg-racing-cyan/20 text-racing-cyan border-0">{t("events.scheduled")}</Badge>;
    }
  };

  const toggleResultExpand = (resultId: string) => setExpandedResultId(expandedResultId === resultId ? null : resultId);

  return (
    <div className="space-y-6 animate-slide-in">
      <Link to={event.championship_id ? `/championships/${event.championship_id}` : "/events"} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-4 h-4" /><span>{t("common.back")}</span></Link>

      <div className="stat-card">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex flex-col items-center justify-center border border-border">
            <span className="font-racing text-xl font-bold text-primary">{format(new Date(event.date), "dd")}</span>
            <span className="text-[10px] uppercase text-muted-foreground">{format(new Date(event.date), "MMM", { locale: ptBR })}</span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {getStatusBadge(event.status)}
              {isOrganizer && <Badge variant="outline" className="border-primary/50 text-primary">{t("eventDetail.organizer")}</Badge>}
            </div>
            <h1 className="font-racing text-3xl font-bold text-gradient-racing mb-2">{event.name}</h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{format(new Date(event.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</span>
              {event.track && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{event.track.name}</span>}
              {event.championship && <Link to={`/championships/${event.championship_id}`} className="flex items-center gap-1 hover:text-primary transition-colors"><Trophy className="w-4 h-4" />{event.championship.name}</Link>}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="heats" className="space-y-4">
        <TabsList className="bg-card border border-border">
          <TabsTrigger value="heats" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Flag className="w-4 h-4 mr-2" />{t("eventDetail.heats")}</TabsTrigger>
          <TabsTrigger value="results" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Trophy className="w-4 h-4 mr-2" />{t("events.results")}</TabsTrigger>
          {userResult && <TabsTrigger value="my-telemetry" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"><Timer className="w-4 h-4 mr-2" />{t("eventDetail.myTelemetry")}</TabsTrigger>}
        </TabsList>

        <TabsContent value="heats" className="space-y-4">
          {isOrganizer && <div className="flex justify-end"><CreateHeatDialog eventId={id!} /></div>}
          {heats && heats.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {heats.map((heat) => (
                <div key={heat.id} className="stat-card hover:border-primary/50 transition-all cursor-pointer" onClick={() => setSelectedHeatId(heat.id)}>
                  <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"><Flag className="w-5 h-5 text-primary" /></div><div><h3 className="font-semibold">{heat.name}</h3>{heat.weather_condition && <p className="text-xs text-muted-foreground capitalize">{heat.weather_condition}</p>}</div></div>
                  {heat.start_time && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="w-4 h-4" />{format(new Date(heat.start_time), "HH:mm")}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div className="stat-card text-center py-12">
              <Flag className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-racing text-xl font-bold mb-2">{t("eventDetail.noHeats")}</h3>
              <p className="text-muted-foreground mb-4">{isOrganizer ? t("eventDetail.clickNewHeat") : t("eventDetail.heatsAddedByOrganizer")}</p>
              {isOrganizer && <CreateHeatDialog eventId={id!} />}
            </div>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {!selectedHeatId && heats && heats.length > 0 && (
            <div className="stat-card"><p className="text-muted-foreground mb-4">{t("eventDetail.selectHeat")}</p><div className="flex flex-wrap gap-2">{heats.map((heat) => <Button key={heat.id} variant="outline" size="sm" onClick={() => setSelectedHeatId(heat.id)}>{heat.name}</Button>)}</div></div>
          )}
          {selectedHeatId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between"><h3 className="font-racing text-lg font-bold">{heats?.find(h => h.id === selectedHeatId)?.name}</h3><Button variant="ghost" size="sm" onClick={() => setSelectedHeatId(null)}>{t("eventDetail.switchHeat")}</Button></div>
              {isOrganizer && members && <div className="stat-card"><OrganizerResultsPanel heatId={selectedHeatId} results={heatResults || []} members={members} organizerProfile={championship?.organizer || null} /></div>}
              {!isOrganizer && heatResults && heatResults.length > 0 && (
                <div className="space-y-3">
                  {heatResults.map((result: HeatResult) => {
                    const isExpanded = expandedResultId === result.id;
                    const isOwnResult = result.driver_id === user?.id;
                    return (
                      <div key={result.id} className="stat-card p-0 overflow-hidden">
                        <div className={`p-4 ${isOwnResult ? "bg-primary/5 border-l-2 border-primary" : ""}`} onClick={() => isOwnResult && toggleResultExpand(result.id)} role={isOwnResult ? "button" : undefined}>
                          <div className="flex items-center gap-4">
                            <span className={`font-racing text-2xl w-8 ${result.position === 1 ? "text-racing-yellow" : result.position === 2 ? "text-muted-foreground" : result.position === 3 ? "text-orange-400" : ""}`}>{result.position}</span>
                            <div className="flex-1"><p className="font-medium">{result.driver_id ? <Link to={`/pilots/${result.driver_id}`} className="hover:text-primary transition-colors hover:underline">{result.driver?.full_name || result.driver_name_text || "—"}</Link> : (result.driver_name_text || "—")}{isOwnResult && <span className="text-xs text-primary ml-2">({t("common.you")})</span>}</p><div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">{result.kart_number && <span>Kart #{result.kart_number}</span>}{result.best_lap_time && <span>TMV: {result.best_lap_time}</span>}{result.total_time && <span>TT: {result.total_time}</span>}</div></div>
                            <div className="text-right"><span className="font-semibold text-primary">{result.points || 0} pts</span>{isOwnResult && <button className="block text-muted-foreground mt-1">{isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>}</div>
                          </div>
                        </div>
                        {isExpanded && isOwnResult && <div className="border-t border-border p-4 bg-muted/30"><DriverTelemetryPanel heatResult={result} isOwner={true} /></div>}
                      </div>
                    );
                  })}
                </div>
              )}
              {!isOrganizer && (!heatResults || heatResults.length === 0) && <div className="stat-card text-center py-8"><Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" /><p className="text-muted-foreground">{t("eventDetail.noResultsRecorded")}</p></div>}
            </div>
          )}
          {!selectedHeatId && (!heats || heats.length === 0) && <div className="stat-card text-center py-12"><Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" /><h3 className="font-racing text-xl font-bold mb-2">{t("eventDetail.noResults")}</h3><p className="text-muted-foreground">{t("eventDetail.resultsAfterHeats")}</p></div>}
        </TabsContent>

        {userResult && (
          <TabsContent value="my-telemetry" className="space-y-4">
            <div className="stat-card">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center"><span className="font-racing text-xl font-bold text-primary">{userResult.position}</span></div>
                <div><h3 className="font-semibold">{heats?.find(h => h.id === selectedHeatId)?.name || t("eventDetail.heats")}</h3><div className="flex flex-wrap gap-4 text-sm text-muted-foreground">{userResult.kart_number && <span>Kart #{userResult.kart_number}</span>}{userResult.best_lap_time && <span>TMV: {userResult.best_lap_time}</span>}{userResult.total_time && <span>TT: {userResult.total_time}</span>}{userResult.total_laps && <span>{t("common.laps")}: {userResult.total_laps}</span>}</div></div>
              </div>
              <DriverTelemetryPanel heatResult={userResult} isOwner={true} />
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
