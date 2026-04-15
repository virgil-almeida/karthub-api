import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useProfiles } from "@/hooks/useProfiles";
import { useChampionships } from "@/hooks/useChampionships";
import { useEvents } from "@/hooks/useEvents";
import { StatCard } from "@/components/dashboard/StatCard";
import { CareerChart } from "@/components/dashboard/CareerChart";
import { BadgesDisplay } from "@/components/dashboard/BadgesDisplay";
import { UpcomingEvents } from "@/components/dashboard/UpcomingEvents";
import { RaceTypeFilter, type RaceFilterType } from "@/components/dashboard/RaceTypeFilter";
import { Users, Trophy, Timer, Flag, Gauge, Calendar } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { data: profiles } = useProfiles();
  const { data: championships } = useChampionships();
  const { data: events } = useEvents();
  const [filter, setFilter] = useState<RaceFilterType>("all");

  const totalPilots = profiles?.length || 0;
  const totalChampionships = championships?.length || 0;
  const completedEvents = events?.filter(e => e.status === 'completed').length || 0;
  const upcomingEvents = events?.filter(e => e.status === 'scheduled') || [];

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="relative overflow-hidden rounded-xl racing-border p-6 bg-gradient-to-r from-card via-card to-transparent">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent" />
        <div className="relative z-10">
          <p className="text-sm text-racing-cyan uppercase tracking-widest font-medium mb-2">{t("dashboard.welcomeTo")}</p>
          <h1 className="font-racing text-4xl md:text-5xl font-bold text-gradient-racing mb-2">KARTCLUB</h1>
          <p className="text-muted-foreground max-w-xl">{t("dashboard.description")}</p>
          {!user && (
            <div className="mt-6 flex gap-3">
              <Link to="/auth">
                <Button className="racing-gradient text-white font-semibold">{t("auth.enterPlatform")}</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t("dashboard.registeredPilots")} value={totalPilots} subtitle={t("dashboard.onPlatform")} icon={Users} variant="default" />
        <StatCard title={t("dashboard.activeChampionships")} value={totalChampionships} subtitle={t("dashboard.availableForRegistration")} icon={Trophy} variant="racing" />
        <StatCard title={t("dashboard.completedEvents")} value={completedEvents} subtitle={t("dashboard.thisSeason")} icon={Flag} variant="racing" />
        <StatCard title={t("dashboard.nextEvent")} value={upcomingEvents[0]?.name || "—"} subtitle={upcomingEvents[0]?.date || t("dashboard.noEventsScheduled")} icon={Calendar} variant="cyan" />
      </div>

      {user ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Gauge className="w-5 h-5 text-primary" />
                  <h2 className="font-racing text-xl font-bold">{t("dashboard.myEvolution")}</h2>
                </div>
                <Link to="/career">
                  <Button variant="ghost" size="sm" className="text-racing-cyan hover:text-racing-cyan/80">{t("dashboard.seeDetails")}</Button>
                </Link>
              </div>
              <RaceTypeFilter value={filter} onChange={setFilter} />
              <div className="mt-4">
                <CareerChart filter={filter} />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <BadgesDisplay />
            <UpcomingEvents events={upcomingEvents.slice(0, 3)} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="stat-card hover:border-primary/50 transition-colors">
            <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4"><Gauge className="w-6 h-6 text-primary" /></div>
            <h3 className="font-racing text-lg font-bold mb-2">{t("dashboard.advancedTelemetry")}</h3>
            <p className="text-sm text-muted-foreground">{t("dashboard.advancedTelemetryDesc")}</p>
          </div>
          <div className="stat-card hover:border-accent/50 transition-colors">
            <div className="p-3 rounded-lg bg-accent/10 w-fit mb-4"><Trophy className="w-6 h-6 text-accent" /></div>
            <h3 className="font-racing text-lg font-bold mb-2">{t("dashboard.championshipManagement")}</h3>
            <p className="text-sm text-muted-foreground">{t("dashboard.championshipManagementDesc")}</p>
          </div>
          <div className="stat-card hover:border-racing-yellow/50 transition-colors">
            <div className="p-3 rounded-lg bg-racing-yellow/10 w-fit mb-4"><Timer className="w-6 h-6 text-racing-yellow" /></div>
            <h3 className="font-racing text-lg font-bold mb-2">{t("dashboard.gamification")}</h3>
            <p className="text-sm text-muted-foreground">{t("dashboard.gamificationDesc")}</p>
          </div>
        </div>
      )}
    </div>
  );
}
