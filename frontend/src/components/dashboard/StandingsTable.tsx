import { getStandings } from "@/data/mockData";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Link } from "react-router-dom";

export function StandingsTable() {
  const standings = getStandings();

  return (
    <div className="stat-card overflow-hidden">
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="font-racing text-lg font-bold">Classificação</h2>
        <Link
          to="/standings"
          className="text-sm text-racing-cyan hover:text-racing-cyan/80 transition-colors"
        >
          Ver completo →
        </Link>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="w-12 text-center">Pos</TableHead>
              <TableHead>Piloto</TableHead>
              <TableHead className="text-center">Corridas</TableHead>
              <TableHead className="text-center">Vitórias</TableHead>
              <TableHead className="text-center">Pódios</TableHead>
              <TableHead className="text-right font-racing">Pts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {standings.map((driver, index) => (
              <TableRow
                key={driver.id}
                className="border-border hover:bg-muted/50 transition-colors"
              >
                <TableCell className="text-center">
                  <span
                    className={cn(
                      "position-badge text-xs",
                      index === 0 && "position-1",
                      index === 1 && "position-2",
                      index === 2 && "position-3",
                      index > 2 && "bg-muted text-foreground"
                    )}
                  >
                    {index + 1}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="font-racing text-muted-foreground">
                      @{driver.username || "piloto"}
                    </span>
                    <div>
                      <p className="font-medium">{driver.full_name || driver.username}</p>
                      {driver.is_pro_member && (
                        <p className="text-xs text-racing-cyan">PRO</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-center">{driver.stats.totalRaces}</TableCell>
                <TableCell className="text-center text-racing-yellow font-medium">
                  {driver.stats.wins}
                </TableCell>
                <TableCell className="text-center text-racing-cyan font-medium">
                  {driver.stats.podiums}
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-racing text-lg font-bold text-gradient-racing">
                    {driver.stats.totalPoints}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
