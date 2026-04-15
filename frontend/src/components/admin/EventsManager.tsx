import { useState } from "react";
import { useEvents } from "@/hooks/useEvents";
import { useTracks } from "@/hooks/useTracks";
import { useChampionships } from "@/hooks/useChampionships";
import { useAdminUpdateEvent, useAdminDeleteEvent } from "@/hooks/useAdminMutations";
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
import { Calendar, Pencil, Trash2, Search, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Event, EventStatus } from "@/types/kart";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_LABELS: Record<EventStatus, string> = {
  scheduled: "Agendado",
  in_progress: "Em Andamento",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const STATUS_COLORS: Record<EventStatus, string> = {
  scheduled: "bg-blue-500/20 text-blue-400",
  in_progress: "bg-yellow-500/20 text-yellow-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export function EventsManager() {
  const { data: events, isLoading } = useEvents();
  const { data: tracks } = useTracks();
  const { data: championships } = useChampionships();
  const updateEvent = useAdminUpdateEvent();
  const deleteEvent = useAdminDeleteEvent();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    date: "",
    track_id: "",
    championship_id: "",
    status: "scheduled" as EventStatus,
  });

  const filteredEvents = events?.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.championship?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setEditForm({
      name: event.name,
      date: event.date,
      track_id: event.track_id || "",
      championship_id: event.championship_id,
      status: event.status,
    });
  };

  const handleSave = async () => {
    if (!editingEvent) return;

    try {
      await updateEvent.mutateAsync({
        id: editingEvent.id,
        ...editForm,
        track_id: editForm.track_id || null,
      });
      toast({ title: "Etapa atualizada com sucesso!" });
      setEditingEvent(null);
    } catch (error) {
      toast({ title: "Erro ao atualizar etapa", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent.mutateAsync(id);
      toast({ title: "Etapa removida com sucesso!" });
    } catch (error) {
      toast({ title: "Erro ao remover etapa", variant: "destructive" });
    }
  };

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-racing-red" />
          <h2 className="font-racing text-xl font-bold">Gestão de Etapas</h2>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar etapa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 racing-input"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredEvents && filteredEvents.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Etapa</TableHead>
              <TableHead>Campeonato</TableHead>
              <TableHead>Pista</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.map((event) => (
              <TableRow key={event.id}>
                <TableCell className="font-medium">{event.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {event.championship?.name || "—"}
                </TableCell>
                <TableCell>
                  {event.track ? (
                    <span className="flex items-center gap-1 text-sm">
                      <MapPin className="w-3 h-3 text-muted-foreground" />
                      {event.track.name}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(event.date), "dd MMM yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell>
                  <Badge className={STATUS_COLORS[event.status]}>
                    {STATUS_LABELS[event.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(event)}
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
                        <AlertDialogTitle>Remover etapa?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. A etapa e todas suas baterias serão permanentemente removidas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(event.id)}
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
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Nenhuma etapa encontrada</p>
        </div>
      )}

      {/* Edit Event Dialog */}
      <Dialog open={!!editingEvent} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="stat-card border-border">
          <DialogHeader>
            <DialogTitle className="font-racing text-xl">Editar Etapa</DialogTitle>
            <DialogDescription>
              Altere os dados da etapa
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
              <Label>Campeonato</Label>
              <Select
                value={editForm.championship_id}
                onValueChange={(value) => setEditForm({ ...editForm, championship_id: value })}
              >
                <SelectTrigger className="racing-input mt-1">
                  <SelectValue placeholder="Selecione o campeonato" />
                </SelectTrigger>
                <SelectContent>
                  {championships?.map((champ) => (
                    <SelectItem key={champ.id} value={champ.id}>
                      {champ.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Pista</Label>
              <Select
                value={editForm.track_id || "_none"}
                onValueChange={(value) => setEditForm({ ...editForm, track_id: value === "_none" ? "" : value })}
              >
                <SelectTrigger className="racing-input mt-1">
                  <SelectValue placeholder="Selecione a pista" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhuma</SelectItem>
                  {tracks?.map((track) => (
                    <SelectItem key={track.id} value={track.id}>
                      {track.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data</Label>
              <Input
                type="date"
                className="racing-input mt-1"
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={editForm.status}
                onValueChange={(value) => setEditForm({ ...editForm, status: value as EventStatus })}
              >
                <SelectTrigger className="racing-input mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(STATUS_LABELS) as EventStatus[]).map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_LABELS[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditingEvent(null)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 racing-gradient-red text-white font-semibold"
                onClick={handleSave}
                disabled={updateEvent.isPending}
              >
                {updateEvent.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
