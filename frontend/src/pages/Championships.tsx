import { useTranslation } from "react-i18next";
import { useChampionships } from "@/hooks/useChampionships";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Plus, Trophy, Users, Lock, Globe, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function Championships() {
  const { t } = useTranslation();
  const { user, canCreateChampionships } = useAuth();
  const { data: championships, isLoading } = useChampionships();

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-racing text-3xl font-bold text-gradient-racing">{t("championships.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("championships.subtitle")}</p>
        </div>
        {user && canCreateChampionships && (
          <Link to="/organizer"><Button className="w-fit racing-gradient text-white font-semibold"><Plus className="w-4 h-4 mr-2" />{t("championships.createChampionship")}</Button></Link>
        )}
      </div>

      {championships && championships.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {championships.map((championship) => (
            <Link key={championship.id} to={`/championships/${championship.id}`} className="block group">
              <div className="stat-card hover:border-primary/50 transition-all duration-300 h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border border-border group-hover:border-primary/50 transition-colors">
                    {championship.logo_url ? <img src={championship.logo_url} alt={championship.name} className="w-full h-full rounded-lg object-cover" /> : <Trophy className="w-7 h-7 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {championship.is_private ? <Lock className="w-3 h-3 text-racing-yellow" /> : <Globe className="w-3 h-3 text-racing-green" />}
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{championship.is_private ? t("championships.private") : t("championships.public")}</span>
                    </div>
                    <h3 className="font-racing text-lg font-bold truncate group-hover:text-primary transition-colors">{championship.name}</h3>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                {championship.rules_summary && <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{championship.rules_summary}</p>}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users className="w-4 h-4" /><span>— {t("common.pilots")}</span></div>
                  <span className="text-xs text-racing-cyan">{t("common.details")}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="stat-card text-center py-12">
          <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="font-racing text-xl font-bold mb-2">{t("championships.noChampionships")}</h3>
          <p className="text-muted-foreground mb-6">{t("championships.beFirstToCreate")}</p>
          {user && canCreateChampionships && (
            <Link to="/organizer"><Button className="racing-gradient text-white font-semibold"><Plus className="w-4 h-4 mr-2" />{t("championships.createChampionship")}</Button></Link>
          )}
        </div>
      )}
    </div>
  );
}
