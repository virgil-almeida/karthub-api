import { useState, useMemo } from "react";
import { useEvents, useHeats } from "@/hooks/useEvents";
import { useAdminUpdateHeat, useAdminDeleteHeat } from "@/hooks/useAdminMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Timer, Pencil, Trash2, Search, Cloud, Sun, CloudRain } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Heat, WeatherCondition } from "@/types/kart";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const WEATHER_LABELS: Record<WeatherCondition, string> = {
  dry: "Seco",
  wet: "Molhado",
  mixed: "Misto",
};

const WEATHER_ICONS: Record<WeatherCondition, React.ReactNode> = {
  dry: <Sun className="w-3 h-3" />,
  wet: <CloudRain className="w-3 h-3" />,
  mixed: <Cloud className="w-3 h-3" />,
};

export function HeatsManager() {
  const { data: events } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const { data: heats, isLoading } = useHeats(selectedEventId || undefined);
  const updateHeat = useAdminUpdateHeat();
  const deleteHeat = useAdminDeleteHeat();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [editingHeat, setEditingHeat] = useState<Heat | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    weather_condition: "dry" as WeatherCondition,
    start_time: "",
  });

  const filteredHeats = useMemo(() => {
    if (!heats) return [];
    return heats.filter((h) => h.name.toLowerCase().includes(search.toLowerCase()));
  }, [heats, search]);

  const handleEdit = (heat: Heat) => {
    setEditingHeat(heat);
    setEditForm({
      name: heat.name,
      weather_condition: heat.weather_condition,
      start_time: heat.start_time ? heat.start_time.slice(0, 16) : "",
    });
  };

  const handleSave = async () => {
    if (!editingHeat || !selectedEventId) return;

    try {
      await updateHeat.mutateAsync({
        id: editingHeat.id,
        eventId: selectedEventId,
        ...editForm,
        start_time: editForm.start_time || null,
      });
      toast({ title: "Bateria atualizada com sucesso!" });
      setEditingHeat(null);
    } catch (error) {
      toast({ title: "Erro ao atualizar bateria", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!selectedEventId) return;
    try {
      await deleteHeat.mutateAsync({ id, eventId: selectedEventId });
      toast({ title: "Bateria removida com sucesso!" });
    } catch (error) {
      toast({ title: "Erro ao remover bateria", variant: "destructive" });
    }
  };

  return (
    <div className="stat-card">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-racing-red" />
          <h2 className="font-racing text-xl font-bold">Gestão de Baterias</h2>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="racing-input w-64">
              <SelectValue placeholder="Selecione uma etapa" />
            </SelectTrigger>
            <SelectContent>
              {events?.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name} - {event.championship?.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 racing-input"
            />
          </div>
        </div>
      </div>

      {!selectedEventId ? (
        <div className="text-center py-8">
          <Timer className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Selecione uma etapa para ver as baterias</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredHeats.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Clima</TableHead>
              <TableHead>Horário</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredHeats.map((heat) => (
              <TableRow key={heat.id}>
                <TableCell className="font-medium">{heat.name}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="flex items-center gap-1 w-fit">
                    {WEATHER_ICONS[heat.weather_condition]}
                    {WEATHER_LABELS[heat.weather_condition]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {heat.start_time
                    ? format(new Date(heat.start_time), "dd MMM yyyy HH:mm", { locale: ptBR })
                    : "—"}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(heat)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover bateria?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. A bateria e todos seus resultados serão permanentemente removidos.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(heat.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8">
          <Timer className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Nenhuma bateria encontrada</p>
        </div>
      )}

      {/* Edit Heat Dialog */}
      <Dialog open={!!editingHeat} onOpenChange={(open) => !open && setEditingHeat(null)}>
        <DialogContent className="stat-card border-border">
          <DialogHeader>
            <DialogTitle className="font-racing text-xl">Editar Bateria</DialogTitle>
            <DialogDescription>
              Altere os dados da bateria
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                className="racing-input mt-1"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Condição Climática</Label>
              <Select
                value={editForm.weather_condition}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, weather_condition: value as WeatherCondition })
                }
              >
                <SelectTrigger className="racing-input mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(WEATHER_LABELS) as WeatherCondition[]).map((weather) => (
                    <SelectItem key={weather} value={weather}>
                      <span className="flex items-center gap-2">
                        {WEATHER_ICONS[weather]}
                        {WEATHER_LABELS[weather]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Horário de Início</Label>
              <Input
                type="datetime-local"
                className="racing-input mt-1"
                value={editForm.start_time}
                onChange={(e) => setEditForm({ ...editForm, start_time: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditingHeat(null)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 racing-gradient-red text-white font-semibold"
                onClick={handleSave}
                disabled={updateHeat.isPending}
              >
                {updateHeat.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
