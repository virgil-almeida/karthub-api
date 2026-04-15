import { useAuth } from "@/contexts/AuthContext";
import { useCurrentProfile } from "@/hooks/useProfiles";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserMenu() {
  const { user, isAdmin, signOut } = useAuth();
  const { data: profile } = useCurrentProfile();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (!user) {
    return (
      <Link to="/auth">
        <Button variant="outline" size="sm" className="gap-2">
          <User className="w-4 h-4" />
          {t("auth.signIn")}
        </Button>
      </Link>
    );
  }

  const displayName = profile?.full_name || profile?.username || user.email;
  const initials = (profile?.full_name || user.email || "U").slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Avatar className="w-6 h-6">
            <AvatarImage src={profile?.avatar_url || undefined} alt={displayName || ""} />
            <AvatarFallback className="text-[10px] bg-primary/20 text-primary">{initials}</AvatarFallback>
          </Avatar>
          <span className="max-w-32 truncate">{displayName}</span>
          {isAdmin && <Shield className="w-3 h-3 text-racing-yellow" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="truncate">{displayName}</span>
            {isAdmin && (
              <span className="text-xs text-racing-yellow font-normal">{t("auth.administrator")}</span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} className="text-destructive cursor-pointer">
          <LogOut className="w-4 h-4 mr-2" />
          {t("auth.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
