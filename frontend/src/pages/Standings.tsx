import { useTranslation } from "react-i18next";
import { useLeaderboard } from "@/hooks/useDriverStats";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, User, Crown } from "lucide-react";
import { Link } from "react-router-dom";

export default function Standings() {
  const { t } = useTranslation();
  const { data: standings = [], isLoading } = useLeaderboard();

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-slide-in">
      <div>
        <h1 className="font-racing text-3xl font-bold text-gradient-racing">{t("standings.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("standings.subtitle")}</p>
      </div>

      {standings.length > 0 ? (
        <>
          <div className="stat-card border-racing-yellow/30">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-racing-yellow to-racing-orange flex items-center justify-center"><Trophy className="w-10 h-10 text-background" /></div>
              <div className="flex-1">
                <p className="text-xs uppercase tracking-wider text-racing-yellow">{t("standings.rankingLeader")}</p>
                <Link to={`/pilots/${standings[0]?.id}`} className="hover:opacity-80 transition-opacity">
                  <h2 className="font-racing text-2xl font-bold mt-1">{standings[0]?.full_name || standings[0]?.username || "—"}</h2>
                  <p className="text-muted-foreground">@{standings[0]?.username || "—"}</p>
                </Link>
              </div>
              <div className="text-right">
                <p className="font-racing text-4xl font-bold text-gradient-racing">{standings[0]?.stats.totalPoints ?? "—"}</p>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{t("common.points")}</p>
              </div>
            </div>
          </div>

          <div className="stat-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="w-16 text-center">{t("standings.pos")}</TableHead>
                    <TableHead>{t("standings.pilot")}</TableHead>
                    <TableHead className="text-center">{t("standings.races")}</TableHead>
                    <TableHead className="text-center">{t("standings.winsCol")}</TableHead>
                    <TableHead className="text-center">{t("standings.podiumsCol")}</TableHead>
                    <TableHead className="text-right font-racing">{t("standings.pointsCol")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standings.map((pilot, index) => (
                    <TableRow key={pilot.id} className={cn("border-border hover:bg-muted/50 transition-colors", index === 0 && "bg-racing-yellow/5")}>
                      <TableCell className="text-center"><span className={cn("position-badge text-sm", index === 0 && "position-1", index === 1 && "position-2", index === 2 && "position-3", index > 2 && "bg-muted text-foreground")}>{index + 1}</span></TableCell>
                      <TableCell>
                        <Link to={`/pilots/${pilot.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">{pilot.avatar_url ? <img src={pilot.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : <User className="w-5 h-5 text-muted-foreground" />}</div>
                          <div><p className="font-medium">{pilot.full_name || pilot.username}</p><p className="text-xs text-racing-cyan">@{pilot.username || "—"}</p></div>
                          {pilot.is_pro_member && <Crown className="w-4 h-4 text-racing-yellow" />}
                        </Link>
                      </TableCell>
                      <TableCell className="text-center">{pilot.stats.races}</TableCell>
                      <TableCell className="text-center"><span className="text-racing-yellow font-medium">{pilot.stats.wins}</span></TableCell>
                      <TableCell className="text-center"><span className="text-racing-cyan font-medium">{pilot.stats.podiums}</span></TableCell>
                      <TableCell className="text-right"><span className="font-racing text-xl font-bold text-gradient-racing">{pilot.stats.totalPoints}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </>
      ) : (
        <div className="stat-card text-center py-12">
          <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="font-racing text-xl font-bold mb-2">{t("standings.noStandingsData")}</h3>
          <p className="text-muted-foreground">{t("standings.resultsWillAppear")}</p>
        </div>
      )}
    </div>
  );
}
