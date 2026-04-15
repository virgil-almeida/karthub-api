import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfile } from "@/hooks/useProfiles";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Timer, AlertCircle, CheckCircle } from "lucide-react";
import { z } from "zod";

export default function Auth() {
  const { t } = useTranslation();

  const loginSchema = z.object({
    email: z.string().trim().email({ message: t("auth.invalidEmail") }).max(255),
    password: z.string().min(6, { message: t("auth.passwordMinLength") }).max(72),
  });

  const signupSchema = z.object({
    email: z.string().trim().email({ message: t("auth.invalidEmail") }).max(255),
    password: z.string().min(6, { message: t("auth.passwordMinLength") }).max(72),
    full_name: z.string().min(2, t("auth.nameMinLength")).max(100, t("auth.nameTooLong")),
    username: z.string().min(3, t("auth.usernameMinLength")).max(30, t("auth.usernameTooLong"))
      .regex(/^[a-zA-Z0-9_]+$/, t("auth.usernamePattern")).optional().or(z.literal("")),
    weight: z.number().min(30, t("auth.weightMin")).max(200, t("auth.weightMax")).optional(),
    bio: z.string().max(500, t("auth.bioTooLong")).optional(),
  });

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupData, setSignupData] = useState({ email: "", password: "", full_name: "", username: "", weight: "", bio: "" });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user, isLoading: authLoading } = useAuth();
  const updateProfile = useUpdateProfile();
  const navigate = useNavigate();

  useEffect(() => { if (user && !authLoading) navigate("/", { replace: true }); }, [user, authLoading, navigate]);

  const validateLoginForm = () => {
    try { loginSchema.parse({ email: loginEmail, password: loginPassword }); setError(""); return true; }
    catch (e) { if (e instanceof z.ZodError) setError(e.errors[0].message); return false; }
  };

  const validateSignupForm = () => {
    try {
      signupSchema.parse({ email: signupData.email, password: signupData.password, full_name: signupData.full_name, username: signupData.username || undefined, weight: signupData.weight ? Number(signupData.weight) : undefined, bio: signupData.bio || undefined });
      setFieldErrors({}); setError(""); return true;
    } catch (e) {
      if (e instanceof z.ZodError) { const errors: Record<string, string> = {}; e.errors.forEach(err => { if (err.path[0]) errors[err.path[0] as string] = err.message; }); setFieldErrors(errors); setError(e.errors[0].message); }
      return false;
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSuccess("");
    if (!validateLoginForm()) return;
    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);
    if (error) {
      if (error.message.includes("Invalid login credentials")) setError(t("auth.wrongCredentials"));
      else if (error.message.includes("Email not confirmed")) setError(t("auth.emailNotConfirmed"));
      else setError(error.message);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); setError(""); setSuccess(""); setFieldErrors({});
    if (!validateSignupForm()) return;
    setIsLoading(true);
    const { error: signUpError } = await signUp(signupData.email, signupData.password);
    if (signUpError) {
      setIsLoading(false);
      if (signUpError.message.includes("User already registered")) setError(t("auth.emailAlreadyRegistered"));
      else setError(signUpError.message);
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    const { data: { user: newUser } } = await supabase.auth.getUser();
    if (newUser) {
      await supabase.rpc("ensure_profile_exists" as any);
      try { await updateProfile.mutateAsync({ id: newUser.id, full_name: signupData.full_name, username: signupData.username || undefined, weight: signupData.weight ? Number(signupData.weight) : undefined, bio: signupData.bio || undefined }); } catch (profileError) { console.error("Error updating profile:", profileError); }
    }
    setIsLoading(false);
  };

  if (authLoading) return <div className="flex items-center justify-center min-h-screen bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md stat-card">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center"><div className="w-16 h-16 rounded-full racing-gradient flex items-center justify-center glow-red"><Timer className="w-8 h-8 text-white" /></div></div>
          <CardTitle className="font-racing text-2xl text-gradient-racing">KARTCLUB</CardTitle>
          <CardDescription className="text-muted-foreground">{t("auth.loginOrSignup")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">{t("auth.login")}</TabsTrigger>
              <TabsTrigger value="signup">{t("auth.signUp")}</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="login-email">{t("auth.email")}</Label><Input id="login-email" type="email" placeholder={t("auth.emailPlaceholder")} value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="racing-input" required /></div>
                <div className="space-y-2"><Label htmlFor="login-password">{t("auth.password")}</Label><Input id="login-password" type="password" placeholder={t("auth.passwordPlaceholder")} value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="racing-input" required /></div>
                {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
                <Button type="submit" className="w-full racing-gradient text-white font-semibold" disabled={isLoading}>{isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}{t("auth.signIn")}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="signup-email">{t("auth.email")} <span className="text-destructive">*</span></Label><Input id="signup-email" type="email" placeholder={t("auth.emailPlaceholder")} value={signupData.email} onChange={(e) => setSignupData({ ...signupData, email: e.target.value })} className="racing-input" required />{fieldErrors.email && <p className="text-sm text-destructive">{fieldErrors.email}</p>}</div>
                <div className="space-y-2"><Label htmlFor="signup-password">{t("auth.password")} <span className="text-destructive">*</span></Label><Input id="signup-password" type="password" placeholder={t("auth.passwordPlaceholder")} value={signupData.password} onChange={(e) => setSignupData({ ...signupData, password: e.target.value })} className="racing-input" required />{fieldErrors.password && <p className="text-sm text-destructive">{fieldErrors.password}</p>}</div>
                <div className="space-y-2"><Label htmlFor="signup-full_name">{t("auth.fullName")} <span className="text-destructive">*</span></Label><Input id="signup-full_name" placeholder={t("auth.fullNamePlaceholder")} value={signupData.full_name} onChange={(e) => setSignupData({ ...signupData, full_name: e.target.value })} className="racing-input" required />{fieldErrors.full_name && <p className="text-sm text-destructive">{fieldErrors.full_name}</p>}</div>
                <div className="space-y-2"><Label htmlFor="signup-username">{t("auth.username")} ({t("common.optional")})</Label><Input id="signup-username" placeholder={t("auth.usernamePlaceholder")} value={signupData.username} onChange={(e) => setSignupData({ ...signupData, username: e.target.value })} className="racing-input" />{fieldErrors.username && <p className="text-sm text-destructive">{fieldErrors.username}</p>}</div>
                <div className="space-y-2"><Label htmlFor="signup-weight">{t("auth.weight")} ({t("common.optional")})</Label><Input id="signup-weight" type="number" placeholder={t("auth.weightPlaceholder")} value={signupData.weight} onChange={(e) => setSignupData({ ...signupData, weight: e.target.value })} className="racing-input" min={30} max={200} />{fieldErrors.weight && <p className="text-sm text-destructive">{fieldErrors.weight}</p>}</div>
                <div className="space-y-2"><Label htmlFor="signup-bio">{t("auth.bio")} ({t("common.optional")})</Label><Textarea id="signup-bio" placeholder={t("auth.bioPlaceholder")} value={signupData.bio} onChange={(e) => setSignupData({ ...signupData, bio: e.target.value })} className="racing-input min-h-[60px]" maxLength={500} />{fieldErrors.bio && <p className="text-sm text-destructive">{fieldErrors.bio}</p>}</div>
                {error && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
                {success && <Alert className="border-racing-green bg-racing-green/10"><AlertDescription className="text-racing-green">{success}</AlertDescription></Alert>}
                <Button type="submit" className="w-full racing-gradient text-white font-semibold" disabled={isLoading}>{isLoading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />{t("auth.creatingAccount")}</> : <><CheckCircle className="w-4 h-4 mr-2" />{t("auth.createAccount")}</>}</Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
