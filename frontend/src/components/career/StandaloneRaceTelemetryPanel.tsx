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
  useStandaloneRaceTelemetry,
  useCreateStandaloneRaceTelemetry,
  useUpdateStandaloneRaceTelemetry,
  useDeleteStandaloneRaceTelemetry,
  type StandaloneRaceTelemetryRow,
} from "@/hooks/useStandaloneRaceTelemetry";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save, Timer } from "lucide-react";

interface StandaloneRaceTelemetryPanelProps {
  raceId: string;
  totalLaps?: number | null;
  kartNumber?: number | null;
}

interface TelemetryFormData {
  kart_number: string;
  lap_number: string;
  lap_time: string;
  gap_to_best: string;
  gap_to_leader: string;
  total_time: string;
  average_speed: string;
  sector1: string;
  sector2: string;
  sector3: string;
}

const initialFormData: TelemetryFormData = {
  kart_number: "",
  lap_number: "",
  lap_time: "",
  gap_to_best: "",
  gap_to_leader: "",
  total_time: "",
  average_speed: "",
  sector1: "",
  sector2: "",
  sector3: "",
};

function timeToSeconds(time: string | null): number | null {
  if (!time) return null;
  const parts = time.split(":");
  if (parts.length === 1) return parseFloat(parts[0]) || 0;
  if (parts.length === 2) return (parseInt(parts[0]) * 60) + (parseFloat(parts[1]) || 0);
  if (parts.length === 3) return (parseInt(parts[0]) * 3600) + (parseInt(parts[1]) * 60) + (parseFloat(parts[2]) || 0);
  return 0;
}

export function StandaloneRaceTelemetryPanel({ raceId, totalLaps, kartNumber }: StandaloneRaceTelemetryPanelProps) {
  const { t } = useTranslation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingLap, setEditingLap] = useState<StandaloneRaceTelemetryRow | null>(null);
  const [formData, setFormData] = useState<TelemetryFormData>(initialFormData);

  const { data: telemetryData } = useStandaloneRaceTelemetry(raceId);
  const createTelemetry = useCreateStandaloneRaceTelemetry();
  const updateTelemetry = useUpdateStandaloneRaceTelemetry();
  const deleteTelemetry = useDeleteStandaloneRaceTelemetry();
  const { toast } = useToast();

  const bestTelemetryLap = useMemo(() => {
    if (!telemetryData?.length) return null;
    return telemetryData.reduce((best, current) => {
      const bestTime = timeToSeconds(best.lap_time);
      const currentTime = timeToSeconds(current.lap_time);
      if (currentTime === null) return best;
      if (bestTime === null) return current;
      return currentTime < bestTime ? current : best;
    }, telemetryData[0]);
  }, [telemetryData]);

  const handleOpenAdd = () => {
    const nextLap = (telemetryData?.length || 0) + 1;
    setFormData({ ...initialFormData, lap_number: String(nextLap), kart_number: kartNumber ? String(kartNumber) : "" });
    setIsAddOpen(true);
  };

  const handleOpenEdit = (lap: StandaloneRaceTelemetryRow) => {
    setEditingLap(lap);
    setFormData({
      kart_number: lap.kart_number ? String(lap.kart_number) : "",
      lap_number: String(lap.lap_number),
      lap_time: lap.lap_time,
      gap_to_best: lap.gap_to_best || "",
      gap_to_leader: lap.gap_to_leader || "",
      total_time: lap.total_time || "",
      average_speed: lap.average_speed ? String(lap.average_speed) : "",
      sector1: lap.sector1 || "",
      sector2: lap.sector2 || "",
      sector3: lap.sector3 || "",
    });
  };

  const handleSubmit = async () => {
    if (!formData.lap_number || !formData.lap_time) {
      toast({ title: t("telemetry.lapNumberRequired"), variant: "destructive" });
      return;
    }
    if (totalLaps && parseInt(formData.lap_number) > totalLaps) {
      toast({ title: t("telemetry.lapExceedsTotal", { max: totalLaps }), variant: "destructive" });
      return;
    }
    const data = {
      standalone_race_id: raceId,
      kart_number: formData.kart_number ? parseInt(formData.kart_number) : null,
      lap_number: parseInt(formData.lap_number),
      lap_time: formData.lap_time,
      gap_to_best: formData.gap_to_best || null,
      gap_to_leader: formData.gap_to_leader || null,
      total_time: formData.total_time || null,
      average_speed: formData.average_speed ? parseFloat(formData.average_speed) : null,
      sector1: formData.sector1 || null,
      sector2: formData.sector2 || null,
      sector3: formData.sector3 || null,
    };
    try {
      if (editingLap) {
        const { standalone_race_id, ...updates } = data;
        await updateTelemetry.mutateAsync({ id: editingLap.id, raceId, ...updates });
        toast({ title: t("telemetry.lapUpdated") });
        setEditingLap(null);
      } else {
        await createTelemetry.mutateAsync(data);
        toast({ title: t("telemetry.lapAdded") });
        setIsAddOpen(false);
      }
      setFormData(initialFormData);
    } catch (error) {
      toast({ title: t("telemetry.lapSaveError"), variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTelemetry.mutateAsync({ id, raceId });
      toast({ title: t("telemetry.lapRemoved") });
    } catch (error) {
      toast({ title: t("telemetry.lapRemoveError"), variant: "destructive" });
    }
  };

  const TelemetryForm = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label># Kart</Label>
          <Input type="number" value={formData.kart_number} onChange={(e) => setFormData({ ...formData, kart_number: e.target.value })} placeholder={kartNumber?.toString() || "Ex: 7"} />
        </div>
        <div className="space-y-2">
          <Label>VLT (Nº {t("common.laps").slice(0, -1)}) *</Label>
          <Input type="number" value={formData.lap_number} onChange={(e) => setFormData({ ...formData, lap_number: e.target.value })} placeholder="1" max={totalLaps || undefined} />
          {totalLaps && <p className="text-xs text-muted-foreground">{t("telemetry.max")}: {totalLaps}</p>}
        </div>
        <div className="space-y-2">
          <Label>TV ({t("analytics.time")}) *</Label>
          <Input value={formData.lap_time} onChange={(e) => setFormData({ ...formData, lap_time: e.target.value })} placeholder="1:23.456" />
        </div>
        <div className="space-y-2">
          <Label>DMV ({t("analytics.tmv")})</Label>
          <Input value={formData.gap_to_best} onChange={(e) => setFormData({ ...formData, gap_to_best: e.target.value })} placeholder="+0.234" />
        </div>
        <div className="space-y-2">
          <Label>DLCAT ({t("analytics.dl")})</Label>
          <Input value={formData.gap_to_leader} onChange={(e) => setFormData({ ...formData, gap_to_leader: e.target.value })} placeholder="+1.567" />
        </div>
        <div className="space-y-2">
          <Label>TT ({t("standaloneRace.totalTime")})</Label>
          <Input value={formData.total_time} onChange={(e) => setFormData({ ...formData, total_time: e.target.value })} placeholder="12:34.567" />
        </div>
        <div className="space-y-2 col-span-2">
          <Label>VM ({t("analytics.vm")} km/h)</Label>
          <Input type="number" step="0.01" value={formData.average_speed} onChange={(e) => setFormData({ ...formData, average_speed: e.target.value })} placeholder="85.5" />
        </div>
      </div>
      <details className="border border-border rounded-lg">
        <summary className="p-3 cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
          {t("telemetry.sectorTimes")}
        </summary>
        <div className="p-3 pt-0 grid grid-cols-3 gap-3">
          <div className="space-y-2"><Label>S1</Label><Input value={formData.sector1} onChange={(e) => setFormData({ ...formData, sector1: e.target.value })} placeholder="25.123" /></div>
          <div className="space-y-2"><Label>S2</Label><Input value={formData.sector2} onChange={(e) => setFormData({ ...formData, sector2: e.target.value })} placeholder="28.456" /></div>
          <div className="space-y-2"><Label>S3</Label><Input value={formData.sector3} onChange={(e) => setFormData({ ...formData, sector3: e.target.value })} placeholder="29.877" /></div>
        </div>
      </details>
    </div>
  );

  return (
    <div className="space-y-4 pt-3 border-t border-border mt-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-2 text-sm">
          <Timer className="w-4 h-4" />
          {t("telemetry.myTelemetry")}
          {telemetryData && telemetryData.length > 0 && (
            <span className="text-xs text-muted-foreground font-normal">({telemetryData.length} {t("common.laps").toLowerCase()})</span>
          )}
        </h4>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" onClick={handleOpenAdd}>
              <Plus className="w-4 h-4 mr-2" />
              {t("telemetry.addLap")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{t("telemetry.addLap")}</DialogTitle></DialogHeader>
            <TelemetryForm />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>{t("common.cancel")}</Button>
              <Button onClick={handleSubmit} disabled={createTelemetry.isPending}><Save className="w-4 h-4 mr-2" />{t("common.save")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {editingLap && (
        <Dialog open={!!editingLap} onOpenChange={(open) => !open && setEditingLap(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{t("telemetry.editLap", { num: editingLap.lap_number })}</DialogTitle></DialogHeader>
            <TelemetryForm />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setEditingLap(null)}>{t("common.cancel")}</Button>
              <Button onClick={handleSubmit} disabled={updateTelemetry.isPending}><Save className="w-4 h-4 mr-2" />{t("common.save")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {telemetryData && telemetryData.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2">#</th>
                <th className="text-left p-2">VLT</th>
                <th className="text-left p-2">TV</th>
                <th className="text-left p-2">DMV</th>
                <th className="text-left p-2">DLCAT</th>
                <th className="text-left p-2">TT</th>
                <th className="text-left p-2">VM</th>
                <th className="text-right p-2">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {telemetryData.map((lap) => (
                <tr key={lap.id} className={`border-t border-border ${bestTelemetryLap?.id === lap.id ? "bg-primary/10" : ""}`}>
                  <td className="p-2 text-muted-foreground">{lap.kart_number || "—"}</td>
                  <td className="p-2 font-medium">{lap.lap_number}</td>
                  <td className={`p-2 ${bestTelemetryLap?.id === lap.id ? "text-primary font-bold" : ""}`}>{lap.lap_time}</td>
                  <td className="p-2 text-muted-foreground">{lap.gap_to_best || "—"}</td>
                  <td className="p-2 text-muted-foreground">{lap.gap_to_leader || "—"}</td>
                  <td className="p-2 text-muted-foreground">{lap.total_time || "—"}</td>
                  <td className="p-2 text-muted-foreground">{lap.average_speed ? `${lap.average_speed}` : "—"}</td>
                  <td className="p-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleOpenEdit(lap)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("telemetry.removeLapNum", { num: lap.lap_number })}</AlertDialogTitle>
                            <AlertDialogDescription>{t("telemetry.cannotBeUndone")}</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(lap.id)}>{t("common.remove")}</AlertDialogAction>
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
        <p className="text-center py-4 text-muted-foreground text-sm">
          {t("telemetry.noTelemetryClickAdd")}
        </p>
      )}
    </div>
  );
}
