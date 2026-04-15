import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateStandaloneRace } from "@/hooks/useStandaloneRaces";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

export function AddStandaloneRaceDialog() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const createRace = useCreateStandaloneRace();

  const [formData, setFormData] = useState({
    race_type: "training" as "training" | "standalone",
    track_name: "",
    date: new Date().toISOString().split("T")[0],
    position: "",
    kart_number: "",
    total_laps: "",
    best_lap_time: "",
    total_time: "",
    average_speed: "",
    gap_to_leader: "",
    points: "",
    notes: "",
  });

  const resetForm = () => {
    setFormData({
      race_type: "training",
      track_name: "",
      date: new Date().toISOString().split("T")[0],
      position: "",
      kart_number: "",
      total_laps: "",
      best_lap_time: "",
      total_time: "",
      average_speed: "",
      gap_to_leader: "",
      points: "",
      notes: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createRace.mutate(
      {
        race_type: formData.race_type,
        track_name: formData.track_name || null,
        date: formData.date,
        position: formData.position ? parseInt(formData.position) : null,
        kart_number: formData.kart_number ? parseInt(formData.kart_number) : null,
        total_laps: formData.total_laps ? parseInt(formData.total_laps) : null,
        best_lap_time: formData.best_lap_time || null,
        total_time: formData.total_time || null,
        average_speed: formData.average_speed ? parseFloat(formData.average_speed) : null,
        gap_to_leader: formData.gap_to_leader || null,
        points: formData.points ? parseInt(formData.points) : 0,
        notes: formData.notes || null,
      },
      {
        onSuccess: () => {
          resetForm();
          setOpen(false);
        },
      }
    );
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="racing-gradient text-white font-semibold gap-2">
          <Plus className="w-4 h-4" />
          {t("standaloneRace.addRace")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-racing text-xl">{t("standaloneRace.registerRace")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("standaloneRace.type")}</Label>
              <Select value={formData.race_type} onValueChange={(v) => updateField("race_type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="training">{t("standaloneRace.training")}</SelectItem>
                  <SelectItem value="standalone">{t("standaloneRace.standalone")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{t("standaloneRace.date")}</Label>
              <Input type="date" value={formData.date} onChange={(e) => updateField("date", e.target.value)} required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("standaloneRace.trackName")}</Label>
              <Input placeholder={t("standaloneRace.trackNamePlaceholder")} value={formData.track_name} onChange={(e) => updateField("track_name", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label># Kart</Label>
              <Input type="number" placeholder="Nº" value={formData.kart_number} onChange={(e) => updateField("kart_number", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("standaloneRace.finalPosition")}</Label>
              <Input type="number" min="1" placeholder="P1" value={formData.position} onChange={(e) => updateField("position", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("standaloneRace.totalLaps")}</Label>
              <Input type="number" min="1" placeholder={t("common.laps")} value={formData.total_laps} onChange={(e) => updateField("total_laps", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("standaloneRace.bestLapTime")}</Label>
              <Input placeholder="00:00.000" value={formData.best_lap_time} onChange={(e) => updateField("best_lap_time", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("standaloneRace.totalTime")}</Label>
              <Input placeholder="00:00.000" value={formData.total_time} onChange={(e) => updateField("total_time", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("standaloneRace.avgSpeed")}</Label>
              <Input type="number" step="0.01" placeholder={t("analytics.vm")} value={formData.average_speed} onChange={(e) => updateField("average_speed", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("standaloneRace.gapToLeader")}</Label>
              <Input placeholder="+0.000" value={formData.gap_to_leader} onChange={(e) => updateField("gap_to_leader", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t("common.points")}</Label>
              <Input type="number" min="0" placeholder="0" value={formData.points} onChange={(e) => updateField("points", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("standaloneRace.notes")}</Label>
            <Textarea placeholder={t("standaloneRace.notesPlaceholder")} value={formData.notes} onChange={(e) => updateField("notes", e.target.value)} rows={2} />
          </div>

          <Button type="submit" className="w-full racing-gradient text-white font-semibold" disabled={createRace.isPending}>
            {createRace.isPending ? t("common.saving") : t("standaloneRace.registerButton")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}