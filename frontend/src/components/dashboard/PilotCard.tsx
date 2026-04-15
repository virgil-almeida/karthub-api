import { DriverStanding } from "@/types/kart";
import { cn } from "@/lib/utils";
import { User, Trophy, Timer } from "lucide-react";
import { Link } from "react-router-dom";

interface PilotCardProps {
  pilot: DriverStanding;
  rank: number;
}

export function PilotCard({ pilot, rank }: PilotCardProps) {
  return (
    <Link
      to={`/pilots/${pilot.id}`}
      className="block group"
    >
      <div className="stat-card hover:border-primary/50 transition-all duration-300 overflow-hidden">
        {/* Header with rank */}
        <div className="flex items-center justify-between mb-4">
          <div
            className={cn(
              "position-badge text-sm",
              rank === 1 && "position-1",
              rank === 2 && "position-2",
              rank === 3 && "position-3",
              rank > 3 && "bg-muted text-foreground"
            )}
          >
            {rank}
          </div>
          <div className="font-racing text-2xl font-bold text-muted-foreground group-hover:text-primary transition-colors">
            @{pilot.username || "piloto"}
          </div>
        </div>

        {/* Pilot Avatar */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center border-2 border-border group-hover:border-primary/50 transition-colors">
            {pilot.avatar_url ? (
              <img src={pilot.avatar_url} alt={pilot.full_name || ""} className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
              {pilot.full_name || pilot.username}
            </h3>
            {pilot.is_pro_member && (
              <p className="text-sm text-racing-cyan font-medium">PRO Member</p>
            )}
            {pilot.weight && (
              <p className="text-xs text-muted-foreground">{pilot.weight}kg</p>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-lg font-racing font-bold text-gradient-racing">
              {pilot.stats.totalPoints}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Pontos
            </p>
          </div>
          <div className="text-center">
            <p className="text-lg font-racing font-bold text-racing-yellow">
              {pilot.stats.wins}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Vitórias
            </p>
          </div>
          <div className="text-center">
            <p className="text-lg font-racing font-bold text-racing-cyan">
              {pilot.stats.podiums}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Pódios
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
