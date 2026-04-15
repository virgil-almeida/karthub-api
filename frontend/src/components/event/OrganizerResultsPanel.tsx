import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  useCreateOrganizerHeatResult,
  useUpdateOrganizerHeatResult,
  useDeleteOrganizerHeatResult,
} from "@/hooks/useOrganizerMutations";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Medal, Save } from "lucide-react";
import { Link } from "react-router-dom";
import type { HeatResult, ChampionshipMember, Profile } from "@/types/kart";

interface OrganizerResultsPanelProps {
  heatId: string;
  results: HeatResult[];
  members: ChampionshipMember[];
  organizerProfile?: Profile | null;
}

interface ResultFormData {
  position: string;
  kart_number: string;
  driver_id: string;
  driver_name_text: string;
  best_lap_time: string;
  total_time: string;
  gap_to_leader: string;
  gap_to_previous: string;
  total_laps: string;
  average_speed: string;
  points: string;
}

const initialFormData: ResultFormData = {
  position: "",
  kart_number: "",
  driver_id: "",
  driver_name_text: "",
  best_lap_time: "",
  total_time: "",
  gap_to_leader: "",
  gap_to_previous: "",
  total_laps: "",
  average_speed: "",
  points: "",
};

export function OrganizerResultsPanel({ heatId, results, members, organizerProfile }: OrganizerResultsPanelProps) {
  const { t } = useTranslation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingResult, setEditingResult] = useState<HeatResult | null>(null);
  const [formData, setFormData] = useState<ResultFormData>(initialFormData);

  const createResult = useCreateOrganizerHeatResult();
  const updateResult = useUpdateOrganizerHeatResult();
  const deleteResult = useDeleteOrganizerHeatResult();
  const { toast } = useToast();

  const availableDrivers = useMemo(() => {
    const activeMembers = members.filter(m => m.status === "active");
    const drivers: { id: string; name: string }[] = activeMembers.map(m => ({
      id: m.profile_id,
      name: m.profile?.full_name || t("standings.pilot"),
    }));
    if (organizerProfile && !drivers.some(d => d.id === organizerProfile.id)) {
      drivers.unshift({
        id: organizerProfile.id,
        name: organizerProfile.full_name || t("organizer.title"),
      });
    }
    return drivers;
  }, [members, organizerProfile, t]);

  const handleOpenAdd = () => {
    setFormData({ ...initialFormData, position: String((results?.length || 0) + 1) });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (result: HeatResult) => {
    setEditingResult(result);
    setFormData({
      position: String(result.position),
      kart_number: result.kart_number?.toString() || "",
      driver_id: result.driver_id || "",
      driver_name_text: result.driver_name_text || "",
      best_lap_time: result.best_lap_time || "",
      total_time: result.total_time || "",
      gap_to_leader: result.gap_to_leader || "",
      gap_to_previous: result.gap_to_previous || "",
      total_laps: result.total_laps?.toString() || "",
      average_speed: result.average_speed?.toString() || "",
      points: result.points?.toString() || "0",
    });
  };

  const handleSubmit = async () => {
    if (!formData.position) {
      toast({ title: t("results.positionRequired"), variant: "destructive" });
      return;
    }
    const data = {
      position: parseInt(formData.position),
      kart_number: formData.kart_number ? parseInt(formData.kart_number) : null,
      driver_id: formData.driver_id || null,
      driver_name_text: formData.driver_name_text || null,
      best_lap_time: formData.best_lap_time || null,
      total_time: formData.total_time || null,
      gap_to_leader: formData.gap_to_leader || null,
      gap_to_previous: formData.gap_to_previous || null,
      total_laps: formData.total_laps ? parseInt(formData.total_laps) : null,
      average_speed: formData.average_speed ? parseFloat(formData.average_speed) : null,
      points: formData.points ? parseInt(formData.points) : 0,
    };
    try {
      if (editingResult) {
        await updateResult.mutateAsync({ id: editingResult.id, heatId, ...data });
        toast({ title: t("results.resultUpdated") });
        setEditingResult(null);
      } else {
        await createResult.mutateAsync({ heat_id: heatId, ...data });
        toast({ title: t("results.resultAdded") });
        setIsAddOpen(false);
      }
      setFormData(initialFormData);
    } catch (error) {
      toast({ title: t("results.resultSaveError"), variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteResult.mutateAsync({ id, heatId });
      toast({ title: t("results.resultRemoved") });
    } catch (error) {
      toast({ title: t("results.resultRemoveError"), variant: "destructive" });
    }
  };

  const getPositionStyle = (position: number) => {
    if (position === 1) return "text-racing-yellow";
    if (position === 2) return "text-muted-foreground";
    if (position === 3) return "text-orange-400";
    return "";
  };

  const ResultForm = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div className="space-y-2">
        <Label>{t("common.position")} *</Label>
        <Input type="number" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} placeholder="1" />
      </div>
      <div className="space-y-2">
        <Label># Kart</Label>
        <Input type="number" value={formData.kart_number} onChange={(e) => setFormData({ ...formData, kart_number: e.target.value })} placeholder="10" />
      </div>
      <div className="space-y-2 col-span-2 md:col-span-1">
        <Label>{t("results.registeredDriver")}</Label>
        <Select value={formData.driver_id || "_none"} onValueChange={(value) => setFormData({ ...formData, driver_id: value === "_none" ? "" : value })}>
          <SelectTrigger><SelectValue placeholder={t("results.select")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">{t("common.none")}</SelectItem>
            {availableDrivers.map((driver) => (<SelectItem key={driver.id} value={driver.id}>{driver.name}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2 col-span-2 md:col-span-1">
        <Label>{t("results.manualName")}</Label>
        <Input value={formData.driver_name_text} onChange={(e) => setFormData({ ...formData, driver_name_text: e.target.value })} placeholder={t("results.driverNamePlaceholder")} />
      </div>
      <div className="space-y-2">
        <Label>TMV ({t("analytics.tmv")})</Label>
        <Input value={formData.best_lap_time} onChange={(e) => setFormData({ ...formData, best_lap_time: e.target.value })} placeholder="1:23.456" />
      </div>
      <div className="space-y-2">
        <Label>TT ({t("standaloneRace.totalTime")})</Label>
        <Input value={formData.total_time} onChange={(e) => setFormData({ ...formData, total_time: e.target.value })} placeholder="10:45.678" />
      </div>
      <div className="space-y-2">
        <Label>DL ({t("analytics.dl")})</Label>
        <Input value={formData.gap_to_leader} onChange={(e) => setFormData({ ...formData, gap_to_leader: e.target.value })} placeholder="+1.234" />
      </div>
      <div className="space-y-2">
        <Label>DA ({t("analytics.da")})</Label>
        <Input value={formData.gap_to_previous} onChange={(e) => setFormData({ ...formData, gap_to_previous: e.target.value })} placeholder="+0.500" />
      </div>
      <div className="space-y-2">
        <Label>TV ({t("common.laps")})</Label>
        <Input type="number" value={formData.total_laps} onChange={(e) => setFormData({ ...formData, total_laps: e.target.value })} placeholder="15" />
      </div>
      <div className="space-y-2">
        <Label>VM ({t("analytics.vm")})</Label>
        <Input type="number" step="0.1" value={formData.average_speed} onChange={(e) => setFormData({ ...formData, average_speed: e.target.value })} placeholder="45.5" />
      </div>
      <div className="space-y-2">
        <Label>{t("common.points")}</Label>
        <Input type="number" value={formData.points} onChange={(e) => setFormData({ ...formData, points: e.target.value })} placeholder="25" />
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{t("results.officialResults")}</h4>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="racing-gradient text-white" onClick={handleOpenAdd}>
              <Plus className="w-4 h-4 mr-2" />
              {t("results.addResult")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{t("results.addResult")}</DialogTitle></DialogHeader>
            <ResultForm />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>{t("common.cancel")}</Button>
              <Button onClick={handleSubmit} disabled={createResult.isPending}><Save className="w-4 h-4 mr-2" />{t("common.save")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {results && results.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2">Pos</th>
                <th className="text-left p-2">#</th>
                <th className="text-left p-2">{t("standings.pilot")}</th>
                <th className="text-left p-2">TMV</th>
                <th className="text-left p-2">TT</th>
                <th className="text-left p-2">DL</th>
                <th className="text-left p-2">DA</th>
                <th className="text-left p-2">TV</th>
                <th className="text-left p-2">VM</th>
                <th className="text-left p-2">Pts</th>
                <th className="text-right p-2">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.id} className="border-t border-border hover:bg-muted/30">
                  <td className="p-2">
                    <span className={`font-racing ${getPositionStyle(result.position)}`}>
                      {result.position === 1 && <Medal className="w-4 h-4 inline mr-1 text-racing-yellow" />}
                      {result.position}
                    </span>
                  </td>
                  <td className="p-2">{result.kart_number || "—"}</td>
                  <td className="p-2 font-medium">{result.driver_id ? <Link to={`/pilots/${result.driver_id}`} className="hover:text-primary transition-colors hover:underline">{result.driver?.full_name || result.driver_name_text || "—"}</Link> : (result.driver_name_text || "—")}</td>
                  <td className="p-2 text-muted-foreground">{result.best_lap_time || "—"}</td>
                  <td className="p-2 text-muted-foreground">{result.total_time || "—"}</td>
                  <td className="p-2 text-muted-foreground">{result.gap_to_leader || "—"}</td>
                  <td className="p-2 text-muted-foreground">{result.gap_to_previous || "—"}</td>
                  <td className="p-2 text-muted-foreground">{result.total_laps || "—"}</td>
                  <td className="p-2 text-muted-foreground">{result.average_speed || "—"}</td>
                  <td className="p-2 font-semibold text-primary">{result.points || 0}</td>
                  <td className="p-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(result)}><Pencil className="w-4 h-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="text-destructive"><Trash2 className="w-4 h-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("results.removeResult")}</AlertDialogTitle>
                            <AlertDialogDescription>{t("telemetry.cannotBeUndone")}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(result.id)}>{t("common.remove")}</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <p>{t("results.noResults")}</p>
          <p className="text-sm mt-1">{t("results.clickAddResult")}</p>
        </div>
      )}

      <Dialog open={!!editingResult} onOpenChange={(open) => !open && setEditingResult(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{t("results.editResult")}</DialogTitle></DialogHeader>
          <ResultForm />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditingResult(null)}>{t("common.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={updateResult.isPending}><Save className="w-4 h-4 mr-2" />{t("common.update")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
