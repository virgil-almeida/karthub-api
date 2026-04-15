import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "racing" | "cyan";
}
export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  variant = "default"
}: StatCardProps) {
  return <div className="stat-card group hover:scale-[1.02] transition-transform duration-200">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            {title}
          </p>
          <p className={cn("font-racing font-bold text-xl", variant === "racing" && "text-gradient-racing", variant === "cyan" && "text-gradient-cyan")}>
            {value}
          </p>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          {trend && trendValue && <p className={cn("text-xs font-medium", trend === "up" && "text-racing-green", trend === "down" && "text-racing-red", trend === "neutral" && "text-muted-foreground")}>
              {trend === "up" && "↑"}
              {trend === "down" && "↓"}
              {trendValue}
            </p>}
        </div>
        <div className={cn("p-3 rounded-lg transition-colors", variant === "default" && "bg-muted", variant === "racing" && "bg-primary/10 group-hover:bg-primary/20", variant === "cyan" && "bg-accent/10 group-hover:bg-accent/20")}>
          <Icon className={cn("w-5 h-5", variant === "default" && "text-muted-foreground", variant === "racing" && "text-primary", variant === "cyan" && "text-accent")} />
        </div>
      </div>
    </div>;
}