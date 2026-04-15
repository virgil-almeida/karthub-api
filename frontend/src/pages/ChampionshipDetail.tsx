import { useParams, Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useChampionship, useChampionshipMembers, useJoinChampionship } from "@/hooks/useChampionships";
import { useEvents } from "@/hooks/useEvents";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MemberManagementPanel } from "@/components/championship/MemberManagementPanel";
import { Trophy, Users, Calendar, Lock, Globe, ArrowLeft, MapPin, UserPlus, Settings, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ChampionshipDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: championship, isLoading } = useChampionship(id);
  const { data: members } = useChampionshipMembers(id);
  const { data: events } = useEvents(id);
  const joinChampionship = useJoinChampionship();

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!championship) return <Navigate to="/championships" replace />;

  const isOrganizer = user?.id === championship.organizer_id;
  const isMember = members?.some(m => m.profile_id === user?.id);
  const activelMembers = members?.filter(m => m.status === "active") || [];
  const pendingMembers = members?.filter(m => m.status === "pending") || [];

  const handleJoin = async () => {
    if (!user) { toast({ title: t("auth.loginRequired"), variant: "destructive" }); return; }
    try { await joinChampionship.mutateAsync(championship.id); toast({ title: t("championships.requestSent"), description: t("championships.awaitApproval") }); }
    catch { toast({ title: t("organizer.joinError"), variant: "destructive" }); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge variant="secondary" className="bg-racing-green/20 text-racing-green border-0">{t("events.completed")}</Badge>;
      case "in_progress": return <Badge variant="secondary" className="bg-racing-yellow/20 text-racing-yellow border-0">{t("events.inProgress")}</Badge>;
      case "cancelled": return <Badge variant="destructive">{t("events.cancelled")}</Badge>;
      default: return <Badge variant="secondary" className="bg-racing-cyan/20 text-racing-cyan border-0">{t("events.scheduled")}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <Link to="/championships" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft className="w-4 h-4" /><span>{t("championships.backToChampionships")}</span></Link>

      <div className="stat-card">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-border flex-shrink-0">
            {championship.logo_url ? <img src={championship.logo_url} alt={championship.name} className="w-full h-full rounded-xl object-cover" /> : <Trophy className="w-10 h-10 text-primary" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {championship.is_private ? <Badge variant="outline" className="border-racing-yellow/50 text-racing-yellow"><Lock className="w-3 h-3 mr-1" />{t("championships.private")}</Badge> : <Badge variant="outline" className="border-racing-green/50 text-racing-green"><Globe className="w-3 h-3 mr-1" />{t("championships.public")}</Badge>}
            </div>
            <h1 className="font-racing text-3xl font-bold text-gradient-racing mb-2">{championship.name}</h1>
            {championship.rules_summary && <p className="text-muted-foreground max-w-2xl">{championship.rules_summary}</p>}
            <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="w-4 h-4" />{activelMembers.length} {t("common.pilots")}</span>
              <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{events?.length || 0} {t("common.events")}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {isOrganizer && members && <MemberManagementPanel championshipId={championship.id} members={members} />}
            {isOrganizer && <Link to={`/organizer?championship=${championship.id}`}><Button variant="outline"><Settings className="w-4 h-4 mr-2" />{t("common.manage")}</Button></Link>}
            {user && !isOrganizer && !isMember && <Button className="racing-gradient text-white" onClick={handleJoin} disabled={joinChampionship.isPending}><UserPlus className="w-4 h-4 mr-2" />{joinChampionship.isPending ? t("common.sending") : t("championships.join")}</Button>}
            {isMember && !isOrganizer && <Badge variant="secondary" className="h-10 px-4 flex items-center">{t("championships.youAreMember")}</Badge>}
          </div>
        </div>
      </div>

      {isOrganizer && pendingMembers.length > 0 && (
        <div className="stat-card border-racing-yellow/50 bg-racing-yellow/10">
          <div className="flex items-center gap-3"><UserPlus className="w-5 h-5 text-racing-yellow" /><div className="flex-1"><p className="font-medium">{pendingMembers.length} {t("championships.pendingRequests")}</p><p className="text-sm text-muted-foreground">{t("championships.manageDriversToApprove")}</p></div></div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-racing text-xl font-bold">{t("nav.events")}</h2>
            {isOrganizer && <Link to={`/events?championship=${championship.id}`}><Button variant="outline" size="sm">{t("championships.manageEvents")}</Button></Link>}
          </div>
          {events && events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event) => (
                <Link key={event.id} to={`/events/${event.id}`} className="block">
                  <div className="stat-card hover:border-primary/50 transition-all duration-200">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex flex-col items-center justify-center">
                        <span className="font-racing text-sm font-bold text-primary">{format(new Date(event.date), "dd")}</span>
                        <span className="text-[9px] uppercase text-muted-foreground">{format(new Date(event.date), "MMM", { locale: ptBR })}</span>
                      </div>
                      <div className="flex-1"><div className="flex items-center gap-2 mb-1">{getStatusBadge(event.status)}</div><h3 className="font-semibold">{event.name}</h3>{event.track && <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{event.track.name}</p>}</div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="stat-card text-center py-8"><Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" /><p className="text-muted-foreground">{t("championships.noEventsRegistered")}</p></div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="font-racing text-xl font-bold">{t("nav.pilots")}</h2>
          {activelMembers.length > 0 ? (
            <div className="stat-card space-y-3">
              {activelMembers.slice(0, 10).map((member: any) => (
                <Link key={member.id} to={`/pilots/${member.profile_id}`} className="flex items-center gap-3 hover:bg-muted/50 rounded-lg p-1 -m-1 transition-colors">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-xs font-bold">{member.profile?.full_name?.charAt(0) || "?"}</div>
                  <span className="text-sm hover:text-primary transition-colors">{member.profile?.full_name || "Piloto"}</span>
                </Link>
              ))}
              {activelMembers.length > 10 && <p className="text-sm text-muted-foreground pt-2 border-t border-border">+{activelMembers.length - 10} {t("common.pilots")}</p>}
            </div>
          ) : (
            <div className="stat-card text-center py-8"><Users className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" /><p className="text-muted-foreground">{t("championships.noDriversRegistered")}</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
