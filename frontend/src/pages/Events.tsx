import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useEvents, useCreateEvent } from "@/hooks/useEvents";
import { useChampionships } from "@/hooks/useChampionships";
import { useTracks } from "@/hooks/useTracks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Calendar, MapPin, Trophy, ChevronRight } from "lucide-react";
import { Navigate, Link, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Events() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const championshipFilter = searchParams.get("championship");
  const { data: events, isLoading } = useEvents();
  const { data: championships } = useChampionships();
  const { data: tracks } = useTracks();
  const createEvent = useCreateEvent();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({ championship_id: championshipFilter || "", track_id: "", name: "", date: "" });

  if (authLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  const myChampionships = championships?.filter(c => c.organizer_id === user.id) || [];
  const filteredEvents = events?.filter(e => !championshipFilter || e.championship_id === championshipFilter) || [];

  const handleCreateEvent = async () => {
    if (!newEvent.name.trim() || !newEvent.championship_id || !newEvent.date) { toast({ title: t("events.fillRequired"), variant: "destructive" }); return; }
    try {
      await createEvent.mutateAsync({ name: newEvent.name, championship_id: newEvent.championship_id, track_id: newEvent.track_id || undefined, date: newEvent.date, status: "scheduled" });
      toast({ title: t("events.eventCreated") }); setIsCreateOpen(false); setNewEvent({ championship_id: championshipFilter || "", track_id: "", name: "", date: "" });
    } catch { toast({ title: t("events.eventCreateError"), variant: "destructive" }); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <span className="px-2 py-1 text-xs rounded bg-racing-green/20 text-racing-green">{t("events.completed")}</span>;
      case "in_progress": return <span className="px-2 py-1 text-xs rounded bg-racing-yellow/20 text-racing-yellow">{t("events.inProgress")}</span>;
      case "cancelled": return <span className="px-2 py-1 text-xs rounded bg-destructive/20 text-destructive">{t("events.cancelled")}</span>;
      default: return <span className="px-2 py-1 text-xs rounded bg-racing-cyan/20 text-racing-cyan">{t("events.scheduled")}</span>;
    }
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-racing text-3xl font-bold text-gradient-racing">{t("events.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("events.subtitle")}</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild><Button className="racing-gradient text-white font-semibold"><Plus className="w-4 h-4 mr-2" />{t("events.newEvent")}</Button></DialogTrigger>
          <DialogContent className="stat-card border-border">
            <DialogHeader>
              <DialogTitle className="font-racing text-xl">{t("events.createEvent")}</DialogTitle>
              <DialogDescription>{t("events.addEventToChampionship")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>{t("events.championship")}</Label><Select value={newEvent.championship_id} onValueChange={(v) => setNewEvent({ ...newEvent, championship_id: v })}><SelectTrigger className="racing-input mt-1"><SelectValue placeholder={t("events.selectChampionship")} /></SelectTrigger><SelectContent>{myChampionships.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>{t("events.eventName")}</Label><Input className="racing-input mt-1" placeholder={t("events.eventNamePlaceholder")} value={newEvent.name} onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })} /></div>
              <div><Label>{t("events.track")}</Label><Select value={newEvent.track_id} onValueChange={(v) => setNewEvent({ ...newEvent, track_id: v })}><SelectTrigger className="racing-input mt-1"><SelectValue placeholder={t("events.selectTrack")} /></SelectTrigger><SelectContent>{tracks?.map(tr => <SelectItem key={tr.id} value={tr.id}>{tr.name} - {tr.location}</SelectItem>)}</SelectContent></Select></div>
              <div><Label>{t("events.date")}</Label><Input className="racing-input mt-1" type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} /></div>
              <Button className="w-full racing-gradient text-white font-semibold" onClick={handleCreateEvent} disabled={createEvent.isPending}>{createEvent.isPending ? t("common.creating") : t("events.createEvent")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div> : filteredEvents.length > 0 ? (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <div key={event.id} className="stat-card hover:border-primary/50 transition-all duration-200">
              <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex flex-col items-center justify-center">
                    <span className="font-racing text-lg font-bold text-primary">{format(new Date(event.date), "dd")}</span>
                    <span className="text-[10px] uppercase text-muted-foreground">{format(new Date(event.date), "MMM", { locale: ptBR })}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">{getStatusBadge(event.status)}</div>
                    <h3 className="font-racing text-xl font-bold">{event.name}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                      {event.track && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.track.name}</span>}
                      <span className="flex items-center gap-1"><Trophy className="w-3 h-3" />{championships?.find(c => c.id === event.championship_id)?.name || "—"}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/events/${event.id}`}><Button variant="outline" size="sm">{t("events.viewHeats")}</Button></Link>
                  <Link to={`/events/${event.id}?tab=results`}><Button variant="outline" size="sm">{t("events.results")}</Button></Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="stat-card text-center py-12">
          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="font-racing text-xl font-bold mb-2">{t("events.noEventsFound")}</h3>
          <p className="text-muted-foreground mb-6">{t("events.createFirstEvent")}</p>
          <Button onClick={() => setIsCreateOpen(true)} className="racing-gradient text-white"><Plus className="w-4 h-4 mr-2" />{t("events.createEvent")}</Button>
        </div>
      )}
    </div>
  );
}
