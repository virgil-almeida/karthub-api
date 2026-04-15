import { useTranslation } from "react-i18next";
import { useProfiles } from "@/hooks/useProfiles";
import { Search, User, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function Pilots() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const { data: profiles, isLoading } = useProfiles();

  const filteredPilots = profiles?.filter(
    (pilot) =>
      pilot.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pilot.username?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-racing text-3xl font-bold text-gradient-racing">{t("pilots.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("pilots.registeredCount", { count: profiles?.length || 0 })}</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder={t("pilots.searchPilot")} className="pl-10 racing-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      {filteredPilots.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPilots.map((pilot) => (
            <Link key={pilot.id} to={`/pilots/${pilot.id}`} className="block">
              <div className="stat-card hover:border-primary/50 transition-all duration-300 group cursor-pointer">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border-2 border-border group-hover:border-primary/50 transition-colors overflow-hidden">
                    {pilot.avatar_url ? <img src={pilot.avatar_url} alt={pilot.full_name || ""} className="w-full h-full rounded-full object-cover" /> : <User className="w-7 h-7 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{pilot.full_name || pilot.username || "Piloto"}</h3>
                    <p className="text-sm text-racing-cyan">@{pilot.username || "—"}</p>
                    {pilot.is_pro_member && <div className="flex items-center gap-1 mt-1"><Crown className="w-3 h-3 text-racing-yellow" /><span className="text-xs text-racing-yellow">PRO Member</span></div>}
                  </div>
                </div>
                {pilot.bio && <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{pilot.bio}</p>}
                <div className="flex items-center justify-between pt-4 border-t border-border text-sm">
                  <span className="text-xs text-muted-foreground">{t("pilots.since")} {new Date(pilot.created_at).toLocaleDateString("pt-BR", { month: "short", year: "numeric" })}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="stat-card text-center py-12">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="font-racing text-xl font-bold mb-2">{searchTerm ? t("pilots.noPilotsFound") : t("pilots.noPilotsRegistered")}</h3>
          <p className="text-muted-foreground">{searchTerm ? t("pilots.tryAnotherSearch") : t("pilots.pilotsWillAppear")}</p>
        </div>
      )}
    </div>
  );
}
