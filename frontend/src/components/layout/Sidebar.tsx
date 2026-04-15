import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Trophy, BarChart3, Timer, ChevronLeft, ChevronRight, Settings, Calendar, Crown, Gauge, ShieldCheck, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { UserMenu } from "./UserMenu";
import { LanguageSelector } from "./LanguageSelector";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarContentProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarContent({ collapsed = false, onNavigate }: SidebarContentProps) {
  const location = useLocation();
  const { t } = useTranslation();
  const {
    user,
    isAdmin,
    canViewAnalytics,
    canCreateChampionships
  } = useAuth();

  const pilotNavItems = [
    { title: t("nav.dashboard"), url: "/", icon: LayoutDashboard, requiredTier: 'free' as const },
    { title: t("nav.career"), url: "/career", icon: Gauge, requiredTier: 'free' as const },
    { title: t("nav.championships"), url: "/championships", icon: Trophy, requiredTier: 'free' as const },
    { title: t("nav.standings"), url: "/standings", icon: Crown, requiredTier: 'free' as const },
    { title: t("nav.pilots"), url: "/pilots", icon: Users, requiredTier: 'user' as const },
    { title: t("nav.analytics"), url: "/analytics", icon: BarChart3, requiredTier: 'user' as const },
  ];

  const organizerNavItems = [
    { title: t("nav.organizer"), url: "/organizer", icon: Settings, requiredTier: 'plus' as const },
    { title: t("nav.events"), url: "/events", icon: Calendar, requiredTier: 'plus' as const },
  ];

  const adminNavItems = [
    { title: t("nav.admin"), url: "/admin", icon: ShieldCheck },
  ];

  return (
    <>
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg racing-gradient flex items-center justify-center glow-red">
            <Timer className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="font-racing text-lg font-bold text-gradient-racing">
                KARTCLUB
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                {t("nav.subtitle")}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
            {t("nav.pilotSection")}
          </p>
        )}
        {pilotNavItems.map(item => {
          const isActive = location.pathname === item.url;
          const isLocked = item.requiredTier === 'user' && !canViewAnalytics;
          if (isLocked) {
            return (
              <div key={item.url} className="flex items-center gap-3 px-3 py-3 rounded-lg text-muted-foreground opacity-50 cursor-not-allowed" title={t("tierUpgrade", { tier: "User" })}>
                <item.icon className="w-5 h-5" />
                {!collapsed && (
                  <>
                    <span className="font-medium flex-1">{item.title}</span>
                    <Lock className="w-3 h-3" />
                  </>
                )}
              </div>
            );
          }
          return (
            <NavLink key={item.url} to={item.url} onClick={onNavigate} className={cn("flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group", isActive ? "bg-gradient-to-r from-primary/20 to-transparent text-primary border-l-2 border-primary" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
              <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {!collapsed && (
                <span className={cn("font-medium", isActive && "font-semibold")}>
                  {item.title}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Organizer Section */}
        {user && canCreateChampionships && (
          <>
            {!collapsed && (
              <p className="px-3 py-2 mt-6 text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {t("nav.organizerSection")}
              </p>
            )}
            {organizerNavItems.map(item => {
              const isActive = location.pathname === item.url;
              return (
                <NavLink key={item.url} to={item.url} onClick={onNavigate} className={cn("flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group", isActive ? "bg-gradient-to-r from-accent/20 to-transparent text-accent border-l-2 border-accent" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
                  <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-accent" : "text-muted-foreground group-hover:text-foreground")} />
                  {!collapsed && (
                    <span className={cn("font-medium", isActive && "font-semibold")}>
                      {item.title}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </>
        )}

        {/* Admin Section */}
        {isAdmin && (
          <>
            {!collapsed && (
              <p className="px-3 py-2 mt-6 text-[10px] uppercase tracking-wider text-racing-red font-medium">
                {t("nav.adminSection")}
              </p>
            )}
            {adminNavItems.map(item => {
              const isActive = location.pathname === item.url;
              return (
                <NavLink key={item.url} to={item.url} onClick={onNavigate} className={cn("flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group", isActive ? "bg-gradient-to-r from-racing-red/20 to-transparent text-racing-red border-l-2 border-racing-red" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
                  <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-racing-red" : "text-muted-foreground group-hover:text-foreground")} />
                  {!collapsed && (
                    <span className={cn("font-medium", isActive && "font-semibold")}>
                      {item.title}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        <LanguageSelector collapsed={collapsed} />
        <UserMenu />
        {!collapsed && (
          <div className="text-xs text-muted-foreground text-center">
            <p>{t("common.season")}</p>
            <p className="text-racing-cyan">● {t("common.online")}</p>
          </div>
        )}
      </div>
    </>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={cn("relative flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300", collapsed ? "w-16" : "w-64")}>
      <SidebarContent collapsed={collapsed} />

      {/* Collapse Button */}
      <button onClick={() => setCollapsed(!collapsed)} className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
