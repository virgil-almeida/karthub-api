import { useState } from "react";
import { useTracks, useCreateTrack, useDeleteTrack } from "@/hooks/useTracks";
import { useAdminUpdateTrack } from "@/hooks/useAdminMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, MapPin, Trash2, Pencil, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Track } from "@/types/kart";

export function TracksManager() {
  const { data: tracks, isLoading } = useTracks();
  const createTrack = useCreateTrack();
  const deleteTrack = useDeleteTrack();
  const updateTrack = useAdminUpdateTrack();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTrack, setNewTrack] = useState({
    name: "",
    location: "",
    length_meters: "",
    map_image_url: "",
  });

  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    location: "",
    length_meters: "",
    map_image_url: "",
  });

  const filteredTracks = tracks?.filter(
    (t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.location.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newTrack.name.trim() || !newTrack.location.trim()) {
      toast({ title: "Nome e localização são obrigatórios", variant: "destructive" });
      return;
    }

    try {
      await createTrack.mutateAsync({
        name: newTrack.name,
        location: newTrack.location,
        length_meters: newTrack.length_meters ? parseInt(newTrack.length_meters) : undefined,
        map_image_url: newTrack.map_image_url || undefined,
      });
      toast({ title: "Pista criada com sucesso!" });
      setIsCreateOpen(false);
      setNewTrack({ name: "", location: "", length_meters: "", map_image_url: "" });
    } catch (error) {
      toast({ title: "Erro ao criar pista", variant: "destructive" });
    }
  };

  const handleEdit = (track: Track) => {
    setEditingTrack(track);
    setEditForm({
      name: track.name,
      location: track.location,
      length_meters: track.length_meters?.toString() || "",
      map_image_url: track.map_image_url || "",
    });
  };

  const handleSave = async () => {
    if (!editingTrack) return;

    try {
      await updateTrack.mutateAsync({
        id: editingTrack.id,
        name: editForm.name,
        location: editForm.location,
        length_meters: editForm.length_meters ? parseInt(editForm.length_meters) : null,
        map_image_url: editForm.map_image_url || null,
      });
      toast({ title: "Pista atualizada com sucesso!" });
      setEditingTrack(null);
    } catch (error) {
      toast({ title: "Erro ao atualizar pista", variant: "destructive" });
    }
  };

  const handleDelete = async (trackId: string) => {
    try {
      await deleteTrack.mutateAsync(trackId);
      toast({ title: "Pista removida com sucesso!" });
    } catch (error) {
      toast({ title: "Erro ao remover pista", variant: "destructive" });
    }
  };

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-racing-red" />
          <h2 className="font-racing text-xl font-bold">Gestão de Pistas</h2>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pista..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 racing-input"
            />
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="racing-gradient-red text-white font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                Nova Pista
              </Button>
            </DialogTrigger>
            <DialogContent className="stat-card border-border">
              <DialogHeader>
                <DialogTitle className="font-racing text-xl">Adicionar Pista</DialogTitle>
                <DialogDescription>
                  Cadastre uma nova pista para ser usada nos campeonatos
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome da Pista</Label>
                  <Input
                    className="racing-input mt-1"
                    placeholder="Ex: Kartódromo Interlagos"
                    value={newTrack.name}
                    onChange={(e) => setNewTrack({ ...newTrack, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Localização</Label>
                  <Input
                    className="racing-input mt-1"
                    placeholder="Ex: São Paulo, SP"
                    value={newTrack.location}
                    onChange={(e) => setNewTrack({ ...newTrack, location: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Comprimento (metros)</Label>
                  <Input
                    className="racing-input mt-1"
                    type="number"
                    placeholder="Ex: 1200"
                    value={newTrack.length_meters}
                    onChange={(e) => setNewTrack({ ...newTrack, length_meters: e.target.value })}
                  />
                </div>
                <div>
                  <Label>URL do Mapa</Label>
                  <Input
                    className="racing-input mt-1"
                    placeholder="https://..."
                    value={newTrack.map_image_url}
                    onChange={(e) => setNewTrack({ ...newTrack, map_image_url: e.target.value })}
                  />
                </div>
                <Button
                  className="w-full racing-gradient-red text-white font-semibold"
                  onClick={handleCreate}
                  disabled={createTrack.isPending}
                >
                  {createTrack.isPending ? "Criando..." : "Criar Pista"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredTracks && filteredTracks.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Comprimento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTracks.map((track) => (
              <TableRow key={track.id}>
                <TableCell className="font-medium">{track.name}</TableCell>
                <TableCell className="text-muted-foreground">{track.location}</TableCell>
                <TableCell>
                  {track.length_meters ? `${track.length_meters}m` : "—"}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(track)}
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
                        <AlertDialogTitle>Remover pista?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. A pista será permanentemente removida.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(track.id)}
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
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Nenhuma pista encontrada</p>
        </div>
      )}

      {/* Edit Track Dialog */}
      <Dialog open={!!editingTrack} onOpenChange={(open) => !open && setEditingTrack(null)}>
        <DialogContent className="stat-card border-border">
          <DialogHeader>
            <DialogTitle className="font-racing text-xl">Editar Pista</DialogTitle>
            <DialogDescription>
              Altere os dados da pista
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Pista</Label>
              <Input
                className="racing-input mt-1"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Localização</Label>
              <Input
                className="racing-input mt-1"
                value={editForm.location}
                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
              />
            </div>
            <div>
              <Label>Comprimento (metros)</Label>
              <Input
                className="racing-input mt-1"
                type="number"
                value={editForm.length_meters}
                onChange={(e) => setEditForm({ ...editForm, length_meters: e.target.value })}
              />
            </div>
            <div>
              <Label>URL do Mapa</Label>
              <Input
                className="racing-input mt-1"
                value={editForm.map_image_url}
                onChange={(e) => setEditForm({ ...editForm, map_image_url: e.target.value })}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditingTrack(null)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 racing-gradient-red text-white font-semibold"
                onClick={handleSave}
                disabled={updateTrack.isPending}
              >
                {updateTrack.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
