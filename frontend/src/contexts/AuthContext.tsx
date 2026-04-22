import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { USE_DJANGO_API } from "@/config/apiConfig";
import {
  api,
  setDjangoTokens,
  clearDjangoTokens,
  getDjangoAccessToken,
  DjangoApiError,
} from "@/lib/djangoApi";

export type SubscriptionTier = "free" | "user" | "plus" | "moderator" | "admin";

// Formato retornado por /auth/me/ e /auth/login/ no Django
export interface DjangoUser {
  id: string;
  email: string;
  role: {
    tier: SubscriptionTier;
    effective_tier: SubscriptionTier;
    expires_at: string | null;
    is_admin: boolean;
    can_view_analytics: boolean;
    can_create_championships: boolean;
  };
}

interface DjangoLoginResponse {
  access: string;
  refresh: string;
  user: DjangoUser;
}

interface AuthContextType {
  user: User | DjangoUser | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  userTier: SubscriptionTier;
  canViewAnalytics: boolean;
  canCreateChampionships: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshTier: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Django auth provider ─────────────────────────────────────────────────────

function useDjangoAuth() {
  const [user, setUser] = useState<DjangoUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userTier, setUserTier] = useState<SubscriptionTier>("free");
  const [canViewAnalytics, setCanViewAnalytics] = useState(false);
  const [canCreateChampionships, setCanCreateChampionships] = useState(false);

  const applyUser = (u: DjangoUser) => {
    setUser(u);
    setUserTier((u.role.effective_tier ?? u.role.tier) as SubscriptionTier);
    setIsAdmin(u.role.is_admin);
    setCanViewAnalytics(u.role.can_view_analytics);
    setCanCreateChampionships(u.role.can_create_championships);
  };

  const resetState = () => {
    setUser(null);
    setUserTier("free");
    setIsAdmin(false);
    setCanViewAnalytics(false);
    setCanCreateChampionships(false);
  };

  useEffect(() => {
    if (!getDjangoAccessToken()) {
      setIsLoading(false);
      return;
    }
    api
      .get<DjangoUser>("/auth/me/")
      .then(applyUser)
      .catch(() => {
        clearDjangoTokens();
        resetState();
      })
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const data = await api.post<DjangoLoginResponse>("/auth/login/", { email, password });
      setDjangoTokens({ access: data.access, refresh: data.refresh });
      applyUser(data.user);
      return { error: null };
    } catch (err) {
      const message = err instanceof DjangoApiError ? err.message : "Falha ao fazer login.";
      return { error: new Error(message) };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const data = await api.post<DjangoLoginResponse>("/auth/register/", {
        email,
        password,
        password_confirm: password,
      });
      setDjangoTokens({ access: data.access, refresh: data.refresh });
      applyUser(data.user);
      return { error: null };
    } catch (err) {
      const message = err instanceof DjangoApiError ? err.message : "Falha ao criar conta.";
      return { error: new Error(message) };
    }
  };

  const signOut = async () => {
    const refresh = localStorage.getItem("karthub_django_refresh");
    try {
      if (refresh) await api.post("/auth/logout/", { refresh });
    } catch {
      // ignora erro no logout
    } finally {
      clearDjangoTokens();
      resetState();
    }
  };

  const refreshTier = async () => {
    if (!user) return;
    try {
      const u = await api.get<DjangoUser>("/auth/me/");
      applyUser(u);
    } catch {
      // mantém estado atual se o refresh falhar
    }
  };

  return {
    user,
    session: null as Session | null,
    isLoading,
    isAdmin,
    userTier,
    canViewAnalytics,
    canCreateChampionships,
    signIn,
    signUp,
    signOut,
    refreshTier,
  };
}

// ─── Supabase auth provider ───────────────────────────────────────────────────

function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userTier, setUserTier] = useState<SubscriptionTier>("free");
  const [canViewAnalytics, setCanViewAnalytics] = useState(false);
  const [canCreateChampionships, setCanCreateChampionships] = useState(false);

  const checkUserPermissions = async () => {
    try {
      const [tierResult, analyticsResult, championshipsResult, adminResult] = await Promise.all([
        supabase.rpc("get_user_tier"),
        supabase.rpc("can_view_analytics"),
        supabase.rpc("can_create_championships"),
        supabase.rpc("is_admin"),
      ]);
      setUserTier((tierResult.data as SubscriptionTier) || "free");
      setCanViewAnalytics(analyticsResult.data === true);
      setCanCreateChampionships(championshipsResult.data === true);
      setIsAdmin(adminResult.data === true);
    } catch {
      setUserTier("free");
      setCanViewAnalytics(false);
      setCanCreateChampionships(false);
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => checkUserPermissions(), 0);
      } else {
        setIsAdmin(false);
        setUserTier("free");
        setCanViewAnalytics(false);
        setCanCreateChampionships(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) checkUserPermissions();
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const refreshTier = async () => {
    if (user) await checkUserPermissions();
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? new Error(error.message) : null };
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    return { error: error ? new Error(error.message) : null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setUserTier("free");
    setCanViewAnalytics(false);
    setCanCreateChampionships(false);
  };

  return {
    user,
    session,
    isLoading,
    isAdmin,
    userTier,
    canViewAnalytics,
    canCreateChampionships,
    signIn,
    signUp,
    signOut,
    refreshTier,
  };
}

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const djangoAuth = useDjangoAuth();
  const supabaseAuth = useSupabaseAuth();

  const value = USE_DJANGO_API.auth ? djangoAuth : supabaseAuth;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
