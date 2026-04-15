import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateOrganizerHeat } from "@/hooks/useOrganizerMutations";
import { useToast } from "@/hooks/use-toast";
import { Plus, Save } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CreateHeatDialogProps {
  eventId: string;
}

export function CreateHeatDialog({ eventId }: CreateHeatDialogProps) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    weather_condition: "dry" as "dry" | "wet" | "mixed",
    start_time: "",
  });

  const createHeat = useCreateOrganizerHeat();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({ title: t("heat.heatNameRequired"), variant: "destructive" });
      return;
    }

    try {
      await createHeat.mutateAsync({
        event_id: eventId,
        name: formData.name,
        weather_condition: formData.weather_condition,
        start_time: formData.start_time || null,
      });
      toast({ title: t("heat.heatCreated") });
      setFormData({ name: "", weather_condition: "dry", start_time: "" });
      setIsOpen(false);
    } catch (error) {
      toast({ title: t("heat.heatCreateError"), variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="racing-gradient text-white">
          <Plus className="w-4 h-4 mr-2" />
          {t("heat.newHeat")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("heat.createHeat")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>{t("heat.heatName")} *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t("heat.heatNamePlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("heat.weatherCondition")}</Label>
            <Select
              value={formData.weather_condition}
              onValueChange={(value: "dry" | "wet" | "mixed") => 
                setFormData({ ...formData, weather_condition: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dry">{t("heat.dry")}</SelectItem>
                <SelectItem value="wet">{t("heat.wet")}</SelectItem>
                <SelectItem value="mixed">{t("heat.mixed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("heat.startTime")}</Label>
            <Input
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={createHeat.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {t("heat.createButton")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}