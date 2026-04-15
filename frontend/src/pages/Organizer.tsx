import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/contexts/AuthContext";
import { useChampionships, useCreateChampionship } from "@/hooks/useChampionships";
import { useEvents } from "@/hooks/useEvents";
import { useTracks, useCreateTrack } from "@/hooks/useTracks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trophy, Calendar, MapPin, Settings, Upload, Users, ImageIcon, Link as LinkIcon, X } from "lucide-react";
import { Navigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Championship } from "@/types/kart";
import { ChampionshipManageDialog } from "@/components/organizer/ChampionshipManageDialog";

export default function Organizer() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading, isAdmin, canCreateChampionships } = useAuth();
  const { data: championships, isLoading: champsLoading } = useChampionships();
  const { data: tracks } = useTracks();
  const { data: events } = useEvents();
  const createChampionship = useCreateChampionship();
  const createTrack = useCreateTrack();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTrackOpen, setIsTrackOpen] = useState(false);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [managingChampionship, setManagingChampionship] = useState<Championship | null>(null);
  const [newChampionship, setNewChampionship] = useState({ name: "", rules_summary: "", is_private: false });
  const [newTrack, setNewTrack] = useState({ name: "", location: "", length_meters: "" });
  const [logoMode, setLogoMode] = useState<"upload" | "link">("upload");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({ title: "Formato inválido. Use JPG, PNG ou WebP.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem muito grande. Máximo 5MB.", variant: "destructive" });
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const clearLogo = () => {
    setLogoFile(null);
    setLogoUrl("");
    setLogoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenManage = (championship: Championship) => { setManagingChampionship(championship); setIsManageOpen(true); };

  if (authLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  if (!canCreateChampionships) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <Trophy className="w-16 h-16 text-muted-foreground opacity-50" />
        <h1 className="font-racing text-2xl font-bold">{t("organizer.restrictedAccess")}</h1>
        <p className="text-muted-foreground text-center max-w-md">{t("organizer.organizerRestricted")}</p>
        <Link to="/"><Button variant="outline">{t("analytics.backToDashboard")}</Button></Link>
      </div>
    );
  }

  const myChampionships = isAdmin ? (championships || []) : (championships?.filter(c => c.organizer_id === user.id) || []);

  const handleCreateChampionship = async () => {
    if (!newChampionship.name.trim()) { toast({ title: t("organizer.nameRequired"), variant: "destructive" }); return; }
    try {
      setIsUploading(true);
      let finalLogoUrl: string | undefined;

      if (logoMode === "upload" && logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const filePath = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from("championship-logos").upload(filePath, logoFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from("championship-logos").getPublicUrl(filePath);
        finalLogoUrl = urlData.publicUrl;
      } else if (logoMode === "link" && logoUrl.trim()) {
        finalLogoUrl = logoUrl.trim();
      }

      await createChampionship.mutateAsync({ ...newChampionship, logo_url: finalLogoUrl });
      toast({ title: t("organizer.championshipCreated") });
      setIsCreateOpen(false);
      setNewChampionship({ name: "", rules_summary: "", is_private: false });
      clearLogo();
    } catch {
      toast({ title: t("organizer.championshipCreateError"), variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateTrack = async () => {
    if (!newTrack.name.trim() || !newTrack.location.trim()) { toast({ title: t("organizer.nameLocationRequired"), variant: "destructive" }); return; }
    try { await createTrack.mutateAsync({ name: newTrack.name, location: newTrack.location, length_meters: newTrack.length_meters ? parseInt(newTrack.length_meters) : undefined }); toast({ title: t("organizer.trackCreated") }); setIsTrackOpen(false); setNewTrack({ name: "", location: "", length_meters: "" }); }
    catch { toast({ title: t("organizer.trackCreateError"), variant: "destructive" }); }
  };

  return (
    <div className="space-y-6 animate-slide-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-racing text-3xl font-bold text-gradient-cyan">{t("organizer.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("organizer.subtitle")}</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Dialog open={isTrackOpen} onOpenChange={setIsTrackOpen}>
              <DialogTrigger asChild><Button variant="outline" className="border-racing-red/30 text-racing-red hover:bg-racing-red/10"><MapPin className="w-4 h-4 mr-2" />{t("organizer.newTrack")}</Button></DialogTrigger>
              <DialogContent className="stat-card border-border">
                <DialogHeader><DialogTitle className="font-racing text-xl">{t("organizer.addTrack")}</DialogTitle><DialogDescription>{t("organizer.addTrackDesc")}</DialogDescription></DialogHeader>
                <div className="space-y-4">
                  <div><Label>{t("organizer.trackName")}</Label><Input className="racing-input mt-1" placeholder={t("organizer.trackNamePlaceholder")} value={newTrack.name} onChange={(e) => setNewTrack({ ...newTrack, name: e.target.value })} /></div>
                  <div><Label>{t("organizer.location")}</Label><Input className="racing-input mt-1" placeholder={t("organizer.locationPlaceholder")} value={newTrack.location} onChange={(e) => setNewTrack({ ...newTrack, location: e.target.value })} /></div>
                  <div><Label>{t("organizer.lengthMeters")}</Label><Input className="racing-input mt-1" type="number" placeholder={t("organizer.lengthPlaceholder")} value={newTrack.length_meters} onChange={(e) => setNewTrack({ ...newTrack, length_meters: e.target.value })} /></div>
                  <Button className="w-full racing-gradient text-white font-semibold" onClick={handleCreateTrack} disabled={createTrack.isPending}>{createTrack.isPending ? t("common.creating") : t("organizer.createTrack")}</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild><Button className="racing-gradient text-white font-semibold"><Plus className="w-4 h-4 mr-2" />{t("championships.newChampionship")}</Button></DialogTrigger>
            <DialogContent className="stat-card border-border">
              <DialogHeader><DialogTitle className="font-racing text-xl">{t("championships.createChampionship")}</DialogTitle><DialogDescription>{t("organizer.championshipBasicInfo")}</DialogDescription></DialogHeader>
              <div className="space-y-4">
                <div><Label>{t("championships.championshipName")}</Label><Input className="racing-input mt-1" placeholder={t("championships.championshipNamePlaceholder")} value={newChampionship.name} onChange={(e) => setNewChampionship({ ...newChampionship, name: e.target.value })} /></div>
                <div><Label>{t("championships.rulesSummary")}</Label><Textarea className="racing-input mt-1" placeholder={t("championships.rulesSummaryPlaceholder")} value={newChampionship.rules_summary} onChange={(e) => setNewChampionship({ ...newChampionship, rules_summary: e.target.value })} /></div>
                <div className="flex items-center justify-between"><div><Label>{t("championships.privateChampionship")}</Label><p className="text-xs text-muted-foreground">{t("championships.inviteOnly")}</p></div><Switch checked={newChampionship.is_private} onCheckedChange={(checked) => setNewChampionship({ ...newChampionship, is_private: checked })} /></div>
                
                {/* Logo section */}
                <div>
                  <Label className="mb-2 block">Logo / Imagem</Label>
                  <Tabs value={logoMode} onValueChange={(v) => { setLogoMode(v as "upload" | "link"); clearLogo(); }}>
                    <TabsList className="w-full">
                      <TabsTrigger value="upload" className="flex-1 gap-1.5"><ImageIcon className="w-3.5 h-3.5" />Upload</TabsTrigger>
                      <TabsTrigger value="link" className="flex-1 gap-1.5"><LinkIcon className="w-3.5 h-3.5" />Link</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upload" className="mt-2">
                      <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileSelect} />
                      <Button type="button" variant="outline" className="w-full" onClick={() => fileInputRef.current?.click()}>
                        <Upload className="w-4 h-4 mr-2" />Escolher imagem
                      </Button>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WebP (máx. 5MB)</p>
                    </TabsContent>
                    <TabsContent value="link" className="mt-2">
                      <Input
                        className="racing-input"
                        placeholder="https://exemplo.com/logo.png"
                        value={logoUrl}
                        onChange={(e) => { setLogoUrl(e.target.value); setLogoPreview(e.target.value || null); }}
                      />
                    </TabsContent>
                  </Tabs>
                  {logoPreview && (
                    <div className="relative mt-3 flex justify-center">
                      <img src={logoPreview} alt="Preview" className="max-h-32 rounded-lg border border-border object-contain" />
                      <button type="button" onClick={clearLogo} className="absolute -top-2 -right-2 p-1 rounded-full bg-destructive text-destructive-foreground hover:opacity-80">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <Button className="w-full racing-gradient text-white font-semibold" onClick={handleCreateChampionship} disabled={createChampionship.isPending || isUploading}>{(createChampionship.isPending || isUploading) ? t("common.creating") : t("championships.createChampionship")}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card"><div className="flex items-center gap-3"><div className="p-3 rounded-lg bg-accent/20"><Trophy className="w-5 h-5 text-accent" /></div><div><p className="text-2xl font-racing font-bold">{myChampionships.length}</p><p className="text-xs text-muted-foreground">{isAdmin ? t("organizer.allChampionships") : t("organizer.myChampionships")}</p></div></div></div>
        <div className="stat-card"><div className="flex items-center gap-3"><div className="p-3 rounded-lg bg-primary/20"><Calendar className="w-5 h-5 text-primary" /></div><div><p className="text-2xl font-racing font-bold">{events?.length || 0}</p><p className="text-xs text-muted-foreground">{t("organizer.createdEvents")}</p></div></div></div>
        <div className="stat-card"><div className="flex items-center gap-3"><div className="p-3 rounded-lg bg-racing-cyan/20"><MapPin className="w-5 h-5 text-racing-cyan" /></div><div><p className="text-2xl font-racing font-bold">{tracks?.length || 0}</p><p className="text-xs text-muted-foreground">{t("organizer.registeredTracks")}</p></div></div></div>
        <div className="stat-card"><div className="flex items-center gap-3"><div className="p-3 rounded-lg bg-racing-yellow/20"><Users className="w-5 h-5 text-racing-yellow" /></div><div><p className="text-2xl font-racing font-bold">—</p><p className="text-xs text-muted-foreground">{t("organizer.registeredDrivers")}</p></div></div></div>
      </div>

      <div>
        <h2 className="font-racing text-xl font-bold mb-4">{isAdmin ? t("organizer.allChampionships") : t("organizer.myChampionships")}</h2>
        {myChampionships.length > 0 ? (
          <div className="space-y-4">
            {myChampionships.map((championship) => (
              <div key={championship.id} className="stat-card hover:border-accent/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent/20 to-primary/20 flex items-center justify-center"><Trophy className="w-6 h-6 text-accent" /></div>
                    <div><h3 className="font-racing text-lg font-bold">{championship.name}</h3><p className="text-sm text-muted-foreground">{championship.is_private ? `🔒 ${t("championships.private")}` : `🌐 ${t("championships.public")}`}</p></div>
                  </div>
                  <div className="flex gap-2">
                    <Link to={`/events?championship=${championship.id}`}><Button variant="outline" size="sm"><Calendar className="w-4 h-4 mr-2" />{t("nav.events")}</Button></Link>
                    <Button variant="outline" size="sm" onClick={() => handleOpenManage(championship)}><Settings className="w-4 h-4 mr-2" />{t("common.manage")}</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="stat-card text-center py-8">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">{t("organizer.noChampionshipsYet")}</p>
            <Button onClick={() => setIsCreateOpen(true)} className="racing-gradient text-white"><Plus className="w-4 h-4 mr-2" />{t("organizer.createFirstChampionship")}</Button>
          </div>
        )}
      </div>

      <div className="stat-card border-dashed border-2 border-border hover:border-primary/50 transition-colors">
        <div className="text-center py-8">
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-racing text-lg font-bold mb-2">{t("organizer.importResults")}</h3>
          <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">{t("organizer.importResultsDesc")}</p>
          <Button variant="outline" disabled><Upload className="w-4 h-4 mr-2" />{t("common.comingSoon")}</Button>
        </div>
      </div>

      <ChampionshipManageDialog championship={managingChampionship} open={isManageOpen} onOpenChange={setIsManageOpen} />
    </div>
  );
}
