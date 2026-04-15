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
import { useLapTelemetry } from "@/hooks/useEvents";
import {
  useCreateLapTelemetry,
  useUpdateLapTelemetry,
  useDeleteLapTelemetry,
} from "@/hooks/useOrganizerMutations";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Save, Timer, AlertTriangle } from "lucide-react";
import type { HeatResult, LapTelemetry } from "@/types/kart";

interface DriverTelemetryPanelProps {
  heatResult: HeatResult;
  isOwner: boolean;
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
  let totalSeconds = 0;
  if (parts.length === 1) {
    totalSeconds = parseFloat(parts[0]) || 0;
  } else if (parts.length === 2) {
    totalSeconds = (parseInt(parts[0]) * 60) + (parseFloat(parts[1]) || 0);
  } else if (parts.length === 3) {
    totalSeconds = (parseInt(parts[0]) * 3600) + (parseInt(parts[1]) * 60) + (parseFloat(parts[2]) || 0);
  }
  return totalSeconds;
}

export function DriverTelemetryPanel({ heatResult, isOwner }: DriverTelemetryPanelProps) {
  const { t } = useTranslation();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingLap, setEditingLap] = useState<LapTelemetry | null>(null);
  const [formData, setFormData] = useState<TelemetryFormData>(initialFormData);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { data: telemetryData } = useLapTelemetry(heatResult.id);
  const createTelemetry = useCreateLapTelemetry();
  const updateTelemetry = useUpdateLapTelemetry();
  const deleteTelemetry = useDeleteLapTelemetry();
  const { toast } = useToast();

  const officialTotalTime = useMemo(() => timeToSeconds(heatResult.total_time), [heatResult.total_time]);
  const officialBestLap = useMemo(() => timeToSeconds(heatResult.best_lap_time), [heatResult.best_lap_time]);
  const officialTotalLaps = heatResult.total_laps;

  const handleOpenAdd = () => {
    const nextLap = (telemetryData?.length || 0) + 1;
    setFormData({
      ...initialFormData,
      lap_number: String(nextLap),
      kart_number: heatResult.kart_number ? String(heatResult.kart_number) : "",
    });
    setValidationError(null);
    setIsAddOpen(true);
  };

  const handleOpenEdit = (lap: LapTelemetry) => {
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
    setValidationError(null);
  };

  const validateEntry = (): boolean => {
    if (officialTotalLaps) {
      const lapNum = parseInt(formData.lap_number);
      if (lapNum > officialTotalLaps) {
        setValidationError(t("telemetry.lapExceedsTotal", { max: officialTotalLaps }));
        return false;
      }
    }
    const lapTimeSeconds = timeToSeconds(formData.lap_time);
    if (lapTimeSeconds !== null && officialBestLap !== null) {
      if (lapTimeSeconds < officialBestLap) {
        setValidationError(t("telemetry.lapTimeBelowBest", { time: heatResult.best_lap_time }));
        return false;
      }
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!formData.lap_number || !formData.lap_time) {
      toast({ title: t("telemetry.lapNumberRequired"), variant: "destructive" });
      return;
    }
    if (!validateEntry()) return;

    const data = {
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
        await updateTelemetry.mutateAsync({ id: editingLap.id, heatResultId: heatResult.id, ...data });
        toast({ title: t("telemetry.lapUpdated") });
        setEditingLap(null);
      } else {
        await createTelemetry.mutateAsync({ heat_result_id: heatResult.id, ...data });
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
      await deleteTelemetry.mutateAsync({ id, heatResultId: heatResult.id });
      toast({ title: t("telemetry.lapRemoved") });
    } catch (error) {
      toast({ title: t("telemetry.lapRemoveError"), variant: "destructive" });
    }
  };

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

  const TelemetryForm = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      {validationError && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {validationError}
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label># Kart</Label>
          <Input type="number" value={formData.kart_number} onChange={(e) => setFormData({ ...formData, kart_number: e.target.value })} placeholder={heatResult.kart_number?.toString() || "Ex: 7"} />
        </div>
        <div className="space-y-2">
          <Label>VLT (Nº {t("common.laps").slice(0, -1)}) *</Label>
          <Input type="number" value={formData.lap_number} onChange={(e) => setFormData({ ...formData, lap_number: e.target.value })} placeholder="1" max={officialTotalLaps || undefined} />
          {officialTotalLaps && <p className="text-xs text-muted-foreground">{t("telemetry.max")}: {officialTotalLaps}</p>}
        </div>
        <div className="space-y-2">
          <Label>TV ({t("analytics.time")}) *</Label>
          <Input value={formData.lap_time} onChange={(e) => setFormData({ ...formData, lap_time: e.target.value })} placeholder="1:23.456" />
          {officialBestLap && <p className="text-xs text-muted-foreground">{t("telemetry.min")}: {heatResult.best_lap_time}</p>}
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

  if (!isOwner) {
    return (
      <div className="space-y-4">
        <h4 className="font-semibold flex items-center gap-2">
          <Timer className="w-4 h-4" />
          {t("telemetry.lapTelemetry")}
        </h4>
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
                </tr>
              </thead>
              <tbody>
                {telemetryData.map((lap) => (
                  <tr key={lap.id} className={`border-t border-border ${bestTelemetryLap?.id === lap.id ? "bg-racing-green/10" : ""}`}>
                    <td className="p-2 text-muted-foreground">{lap.kart_number || "—"}</td>
                    <td className="p-2 font-medium">{lap.lap_number}</td>
                    <td className={`p-2 ${bestTelemetryLap?.id === lap.id ? "text-racing-green font-bold" : ""}`}>{lap.lap_time}</td>
                    <td className="p-2 text-muted-foreground">{lap.gap_to_best || "—"}</td>
                    <td className="p-2 text-muted-foreground">{lap.gap_to_leader || "—"}</td>
                    <td className="p-2 text-muted-foreground">{lap.total_time || "—"}</td>
                    <td className="p-2 text-muted-foreground">{lap.average_speed ? `${lap.average_speed}` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-4 text-muted-foreground">{t("common.noTelemetryRecorded")}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold flex items-center gap-2">
          <Timer className="w-4 h-4" />
          {t("telemetry.myTelemetry")}
        </h4>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" onClick={handleOpenAdd}>
              <Plus className="w-4 h-4 mr-2" />
              {t("telemetry.addLap")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{t("telemetry.addLap")}</DialogTitle>
            </DialogHeader>
            <TelemetryForm />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>{t("common.cancel")}</Button>
              <Button onClick={handleSubmit} disabled={createTelemetry.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {t("common.save")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {(officialTotalLaps || heatResult.best_lap_time || heatResult.total_time) && (
        <div className="p-3 bg-muted/50 rounded-lg text-sm space-y-1">
          <p className="font-medium text-xs uppercase text-muted-foreground">{t("telemetry.officialLimits")}</p>
          <div className="flex flex-wrap gap-4 text-muted-foreground">
            {heatResult.kart_number && <span>Kart: #{heatResult.kart_number}</span>}
            {heatResult.best_lap_time && <span>TMV: {heatResult.best_lap_time}</span>}
            {heatResult.total_time && <span>TT: {heatResult.total_time}</span>}
            {officialTotalLaps && <span>{t("common.laps")}: {officialTotalLaps}</span>}
          </div>
        </div>
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
                <tr key={lap.id} className={`border-t border-border ${bestTelemetryLap?.id === lap.id ? "bg-racing-green/10" : ""}`}>
                  <td className="p-2 text-muted-foreground">{lap.kart_number || "—"}</td>
                  <td className="p-2 font-medium">{lap.lap_number}</td>
                  <td className={`p-2 ${bestTelemetryLap?.id === lap.id ? "text-racing-green font-bold" : ""}`}>{lap.lap_time}</td>
                  <td className="p-2 text-muted-foreground">{lap.gap_to_best || "—"}</td>
                  <td className="p-2 text-muted-foreground">{lap.gap_to_leader || "—"}</td>
                  <td className="p-2 text-muted-foreground">{lap.total_time || "—"}</td>
                  <td className="p-2 text-muted-foreground">{lap.average_speed ? `${lap.average_speed}` : "—"}</td>
                  <td className="p-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(lap)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("telemetry.removeLap")}</AlertDialogTitle>
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
        <div className="text-center py-8 text-muted-foreground">
          <Timer className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t("telemetry.noLapsRecorded")}</p>
          <p className="text-sm mt-1">{t("telemetry.clickAddLap")}</p>
        </div>
      )}

      <Dialog open={!!editingLap} onOpenChange={(open) => !open && setEditingLap(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("telemetry.editLap", { num: editingLap?.lap_number })}</DialogTitle>
          </DialogHeader>
          <TelemetryForm />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setEditingLap(null)}>{t("common.cancel")}</Button>
            <Button onClick={handleSubmit} disabled={updateTelemetry.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {t("common.update")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
