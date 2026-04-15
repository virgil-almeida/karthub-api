import { useState } from "react";
import { useChampionships } from "@/hooks/useChampionships";
import { useProfiles } from "@/hooks/useProfiles";
import { useAdminUpdateChampionship, useAdminDeleteChampionship } from "@/hooks/useAdminMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Trophy, Pencil, Trash2, Search, Lock, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Championship } from "@/types/kart";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ChampionshipsManager() {
  const { data: championships, isLoading } = useChampionships();
  const { data: profiles } = useProfiles();
  const updateChampionship = useAdminUpdateChampionship();
  const deleteChampionship = useAdminDeleteChampionship();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [editingChampionship, setEditingChampionship] = useState<Championship | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    rules_summary: "",
    is_private: false,
    logo_url: "",
    organizer_id: "",
  });

  const filteredChampionships = championships?.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (championship: Championship) => {
    setEditingChampionship(championship);
    setEditForm({
      name: championship.name,
      rules_summary: championship.rules_summary || "",
      is_private: championship.is_private || false,
      logo_url: championship.logo_url || "",
      organizer_id: championship.organizer_id || "",
    });
  };

  const handleSave = async () => {
    if (!editingChampionship) return;

    try {
      await updateChampionship.mutateAsync({
        id: editingChampionship.id,
        ...editForm,
        organizer_id: editForm.organizer_id || undefined,
      });
      toast({ title: "Campeonato atualizado com sucesso!" });
      setEditingChampionship(null);
    } catch (error) {
      toast({ title: "Erro ao atualizar campeonato", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteChampionship.mutateAsync(id);
      toast({ title: "Campeonato removido com sucesso!" });
    } catch (error) {
      toast({ title: "Erro ao remover campeonato", variant: "destructive" });
    }
  };

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-racing-red" />
          <h2 className="font-racing text-xl font-bold">Gestão de Campeonatos</h2>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar campeonato..."
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
      ) : filteredChampionships && filteredChampionships.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Organizador</TableHead>
              <TableHead>Visibilidade</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredChampionships.map((championship) => (
              <TableRow key={championship.id}>
                <TableCell className="font-medium">{championship.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {championship.organizer?.full_name || championship.organizer?.username || "—"}
                </TableCell>
                <TableCell>
                  {championship.is_private ? (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="w-3 h-3" /> Privado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-green-500">
                      <Globe className="w-3 h-3" /> Público
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(championship.created_at), "dd MMM yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(championship)}
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
                        <AlertDialogTitle>Remover campeonato?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. O campeonato e todos seus dados serão permanentemente removidos.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(championship.id)}
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
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Nenhum campeonato encontrado</p>
        </div>
      )}

      {/* Edit Championship Dialog */}
      <Dialog open={!!editingChampionship} onOpenChange={(open) => !open && setEditingChampionship(null)}>
        <DialogContent className="stat-card border-border">
          <DialogHeader>
            <DialogTitle className="font-racing text-xl">Editar Campeonato</DialogTitle>
            <DialogDescription>
              Altere os dados do campeonato
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
              <Label>Organizador</Label>
              <Select
                value={editForm.organizer_id}
                onValueChange={(value) => setEditForm({ ...editForm, organizer_id: value })}
              >
                <SelectTrigger className="racing-input mt-1">
                  <SelectValue placeholder="Selecione o organizador" />
                </SelectTrigger>
                <SelectContent>
                  {profiles?.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.full_name || profile.username || profile.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>URL do Logo</Label>
              <Input
                className="racing-input mt-1"
                value={editForm.logo_url}
                onChange={(e) => setEditForm({ ...editForm, logo_url: e.target.value })}
              />
            </div>
            <div>
              <Label>Resumo das Regras</Label>
              <Textarea
                className="racing-input mt-1"
                value={editForm.rules_summary}
                onChange={(e) => setEditForm({ ...editForm, rules_summary: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Campeonato Privado</Label>
              <Switch
                checked={editForm.is_private}
                onCheckedChange={(checked) => setEditForm({ ...editForm, is_private: checked })}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditingChampionship(null)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 racing-gradient-red text-white font-semibold"
                onClick={handleSave}
                disabled={updateChampionship.isPending}
              >
                {updateChampionship.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
