import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useProfiles } from "@/hooks/useProfiles";
import { useTracks } from "@/hooks/useTracks";
import { useChampionships } from "@/hooks/useChampionships";
import { useEvents } from "@/hooks/useEvents";
import { Navigate } from "react-router-dom";
import { Shield, ShieldCheck, Users, Trophy, Calendar, Timer, Flag, MapPin, Award, Eye } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserRolesManager } from "@/components/admin/UserRolesManager";
import { ProfilesManager } from "@/components/admin/ProfilesManager";
import { ChampionshipsManager } from "@/components/admin/ChampionshipsManager";
import { EventsManager } from "@/components/admin/EventsManager";
import { HeatsManager } from "@/components/admin/HeatsManager";
import { ResultsManager } from "@/components/admin/ResultsManager";
import { TracksManager } from "@/components/admin/TracksManager";
import { BadgesManager } from "@/components/admin/BadgesManager";
import { FeatureVisibilityManager } from "@/components/admin/FeatureVisibilityManager";

export default function Admin() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading, isAdmin } = useAuth();
  const { data: tracks } = useTracks();
  const { data: profiles } = useProfiles();
  const { data: championships } = useChampionships();
  const { data: events } = useEvents();
  const [activeTab, setActiveTab] = useState("roles");

  if (authLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <Shield className="w-16 h-16 text-destructive opacity-50" />
      <h1 className="font-racing text-2xl font-bold text-destructive">{t("admin.accessDenied")}</h1>
      <p className="text-muted-foreground">{t("admin.noPermission")}</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-slide-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><ShieldCheck className="w-8 h-8 text-racing-red" /><h1 className="font-racing text-3xl font-bold text-gradient-red">{t("admin.title")}</h1></div>
          <p className="text-muted-foreground mt-1">{t("admin.subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card border-racing-red/30"><div className="flex items-center gap-3"><div className="p-3 rounded-lg bg-racing-red/20"><Users className="w-5 h-5 text-racing-red" /></div><div><p className="text-2xl font-racing font-bold">{profiles?.length || 0}</p><p className="text-xs text-muted-foreground">{t("admin.users")}</p></div></div></div>
        <div className="stat-card border-racing-red/30"><div className="flex items-center gap-3"><div className="p-3 rounded-lg bg-racing-red/20"><Trophy className="w-5 h-5 text-racing-red" /></div><div><p className="text-2xl font-racing font-bold">{championships?.length || 0}</p><p className="text-xs text-muted-foreground">{t("nav.championships")}</p></div></div></div>
        <div className="stat-card border-racing-red/30"><div className="flex items-center gap-3"><div className="p-3 rounded-lg bg-racing-red/20"><Calendar className="w-5 h-5 text-racing-red" /></div><div><p className="text-2xl font-racing font-bold">{events?.length || 0}</p><p className="text-xs text-muted-foreground">{t("nav.events")}</p></div></div></div>
        <div className="stat-card border-racing-red/30"><div className="flex items-center gap-3"><div className="p-3 rounded-lg bg-racing-red/20"><MapPin className="w-5 h-5 text-racing-red" /></div><div><p className="text-2xl font-racing font-bold">{tracks?.length || 0}</p><p className="text-xs text-muted-foreground">{t("admin.tracks")}</p></div></div></div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9 h-auto">
          <TabsTrigger value="roles" className="flex items-center gap-2 py-3"><ShieldCheck className="w-4 h-4" /><span className="hidden sm:inline">{t("admin.roles")}</span></TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2 py-3"><Users className="w-4 h-4" /><span className="hidden sm:inline">{t("admin.users")}</span></TabsTrigger>
          <TabsTrigger value="championships" className="flex items-center gap-2 py-3"><Trophy className="w-4 h-4" /><span className="hidden sm:inline">{t("nav.championships")}</span></TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2 py-3"><Calendar className="w-4 h-4" /><span className="hidden sm:inline">{t("nav.events")}</span></TabsTrigger>
          <TabsTrigger value="heats" className="flex items-center gap-2 py-3"><Timer className="w-4 h-4" /><span className="hidden sm:inline">{t("admin.heats")}</span></TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2 py-3"><Flag className="w-4 h-4" /><span className="hidden sm:inline">{t("admin.resultsTab")}</span></TabsTrigger>
          <TabsTrigger value="tracks" className="flex items-center gap-2 py-3"><MapPin className="w-4 h-4" /><span className="hidden sm:inline">{t("admin.tracks")}</span></TabsTrigger>
          <TabsTrigger value="badges" className="flex items-center gap-2 py-3"><Award className="w-4 h-4" /><span className="hidden sm:inline">{t("admin.badges")}</span></TabsTrigger>
          <TabsTrigger value="visibility" className="flex items-center gap-2 py-3"><Eye className="w-4 h-4" /><span className="hidden sm:inline">{t("admin.visibility")}</span></TabsTrigger>
        </TabsList>
        <TabsContent value="roles" className="mt-6"><UserRolesManager /></TabsContent>
        <TabsContent value="users" className="mt-6"><ProfilesManager /></TabsContent>
        <TabsContent value="championships" className="mt-6"><ChampionshipsManager /></TabsContent>
        <TabsContent value="events" className="mt-6"><EventsManager /></TabsContent>
        <TabsContent value="heats" className="mt-6"><HeatsManager /></TabsContent>
        <TabsContent value="results" className="mt-6"><ResultsManager /></TabsContent>
        <TabsContent value="tracks" className="mt-6"><TracksManager /></TabsContent>
        <TabsContent value="badges" className="mt-6"><BadgesManager /></TabsContent>
        <TabsContent value="visibility" className="mt-6"><FeatureVisibilityManager /></TabsContent>
      </Tabs>
    </div>
  );
}
