import { useState, useMemo } from "react";
import { useEvents, useHeats, useHeatResults } from "@/hooks/useEvents";
import { useProfiles } from "@/hooks/useProfiles";
import { useAdminUpdateHeatResult, useAdminDeleteHeatResult } from "@/hooks/useAdminMutations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Flag, Pencil, Trash2, Search, Medal, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { HeatResult } from "@/types/kart";
import { CSVImportDialog } from "./CSVImportDialog";

export function ResultsManager() {
  const { data: events } = useEvents();
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedHeatId, setSelectedHeatId] = useState<string>("");
  const [showImportDialog, setShowImportDialog] = useState(false);
  const { data: heats } = useHeats(selectedEventId || undefined);
  const { data: results, isLoading } = useHeatResults(selectedHeatId || undefined);
  const { data: profiles } = useProfiles();
  const updateResult = useAdminUpdateHeatResult();
  const deleteResult = useAdminDeleteHeatResult();
  const { toast } = useToast();

  const selectedHeat = heats?.find((h) => h.id === selectedHeatId);

  const [search, setSearch] = useState("");
  const [editingResult, setEditingResult] = useState<HeatResult | null>(null);
  const [editForm, setEditForm] = useState({
    position: 1,
    driver_id: "",
    driver_name_text: "",
    kart_number: "",
    best_lap_time: "",
    total_time: "",
    gap_to_leader: "",
    gap_to_previous: "",
    average_speed: "",
    total_laps: "",
    payment_status: false,
    points: "",
  });

  const filteredResults = useMemo(() => {
    if (!results) return [];
    return results.filter(
      (r) =>
        r.driver?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.driver_name_text?.toLowerCase().includes(search.toLowerCase())
    );
  }, [results, search]);

  const handleEdit = (result: HeatResult) => {
    setEditingResult(result);
    setEditForm({
      position: result.position,
      driver_id: result.driver_id || "",
      driver_name_text: result.driver_name_text || "",
      kart_number: result.kart_number?.toString() || "",
      best_lap_time: result.best_lap_time || "",
      total_time: result.total_time || "",
      gap_to_leader: result.gap_to_leader || "",
      gap_to_previous: result.gap_to_previous || "",
      average_speed: result.average_speed?.toString() || "",
      total_laps: result.total_laps?.toString() || "",
      payment_status: result.payment_status,
      points: result.points?.toString() || "0",
    });
  };

  const handleSave = async () => {
    if (!editingResult || !selectedHeatId) return;

    try {
      await updateResult.mutateAsync({
        id: editingResult.id,
        heatId: selectedHeatId,
        position: editForm.position,
        driver_id: editForm.driver_id || null,
        driver_name_text: editForm.driver_name_text || null,
        kart_number: editForm.kart_number ? parseInt(editForm.kart_number) : null,
        best_lap_time: editForm.best_lap_time || null,
        total_time: editForm.total_time || null,
        gap_to_leader: editForm.gap_to_leader || null,
        gap_to_previous: editForm.gap_to_previous || null,
        average_speed: editForm.average_speed ? parseFloat(editForm.average_speed) : null,
        total_laps: editForm.total_laps ? parseInt(editForm.total_laps) : null,
        payment_status: editForm.payment_status,
        points: editForm.points ? parseInt(editForm.points) : 0,
      });
      toast({ title: "Resultado atualizado com sucesso!" });
      setEditingResult(null);
    } catch (error) {
      toast({ title: "Erro ao atualizar resultado", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!selectedHeatId) return;
    try {
      await deleteResult.mutateAsync({ id, heatId: selectedHeatId });
      toast({ title: "Resultado removido com sucesso!" });
    } catch (error) {
      toast({ title: "Erro ao remover resultado", variant: "destructive" });
    }
  };

  const getPositionIcon = (position: number) => {
    if (position === 1) return <Medal className="w-4 h-4 text-yellow-500" />;
    if (position === 2) return <Medal className="w-4 h-4 text-gray-400" />;
    if (position === 3) return <Medal className="w-4 h-4 text-amber-600" />;
    return null;
  };

  return (
    <div className="stat-card">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Flag className="w-5 h-5 text-racing-red" />
          
          <h2 className="font-racing text-xl font-bold">Gestão de Resultados</h2>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Select
            value={selectedEventId}
            onValueChange={(value) => {
              setSelectedEventId(value);
              setSelectedHeatId("");
            }}
          >
            <SelectTrigger className="racing-input w-56">
              <SelectValue placeholder="Selecione etapa" />
            </SelectTrigger>
            <SelectContent>
              {events?.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedHeatId} onValueChange={setSelectedHeatId} disabled={!selectedEventId}>
            <SelectTrigger className="racing-input w-48">
              <SelectValue placeholder="Selecione bateria" />
            </SelectTrigger>
            <SelectContent>
              {heats?.map((heat) => (
                <SelectItem key={heat.id} value={heat.id}>
                  {heat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative w-40">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 racing-input"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowImportDialog(true)}
            disabled={!selectedHeatId}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            Importar CSV
          </Button>
        </div>
      </div>

      {/* CSV Import Dialog */}
      {selectedHeat && (
        <CSVImportDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          heatId={selectedHeatId}
          heatName={selectedHeat.name}
        />
      )}

      {!selectedHeatId ? (
        <div className="text-center py-8">
          <Flag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">
            {!selectedEventId ? "Selecione uma etapa" : "Selecione uma bateria"}
          </p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredResults.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pos</TableHead>
              <TableHead>Piloto</TableHead>
              <TableHead>Kart</TableHead>
              <TableHead>Melhor Volta</TableHead>
              <TableHead>Tempo Total</TableHead>
              <TableHead>Pontos</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredResults.map((result) => (
              <TableRow key={result.id}>
                <TableCell>
                  <span className="flex items-center gap-1 font-bold">
                    {getPositionIcon(result.position)}
                    {result.position}º
                  </span>
                </TableCell>
                <TableCell className="font-medium">
                  {result.driver?.full_name || result.driver_name_text || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {result.kart_number || "—"}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {result.best_lap_time || "—"}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {result.total_time || "—"}
                </TableCell>
                <TableCell className="font-bold text-racing-red">
                  {result.points}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(result)}
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
                        <AlertDialogTitle>Remover resultado?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta ação não pode ser desfeita. O resultado será permanentemente removido.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(result.id)}
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
          <Flag className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Nenhum resultado encontrado</p>
        </div>
      )}

      {/* Edit Result Dialog */}
      <Dialog open={!!editingResult} onOpenChange={(open) => !open && setEditingResult(null)}>
        <DialogContent className="stat-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-racing text-xl">Editar Resultado</DialogTitle>
            <DialogDescription>
              Altere os dados do resultado
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Posição</Label>
              <Input
                type="number"
                min={1}
                className="racing-input mt-1"
                value={editForm.position}
                onChange={(e) => setEditForm({ ...editForm, position: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div>
              <Label>Número do Kart</Label>
              <Input
                type="number"
                className="racing-input mt-1"
                value={editForm.kart_number}
                onChange={(e) => setEditForm({ ...editForm, kart_number: e.target.value })}
              />
            </div>
            <div>
              <Label>Piloto (Vinculado)</Label>
              <Select
                value={editForm.driver_id || "_none"}
                onValueChange={(value) => setEditForm({ ...editForm, driver_id: value === "_none" ? "" : value })}
              >
                <SelectTrigger className="racing-input mt-1">
                  <SelectValue placeholder="Selecione o piloto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">Nenhum</SelectItem>
                  {profiles?.map((profile) => (
                    <SelectItem key={profile.id} value={profile.id}>
                      {profile.full_name || profile.username || profile.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nome do Piloto (Texto)</Label>
              <Input
                className="racing-input mt-1"
                value={editForm.driver_name_text}
                onChange={(e) => setEditForm({ ...editForm, driver_name_text: e.target.value })}
              />
            </div>
            <div>
              <Label>Melhor Volta</Label>
              <Input
                className="racing-input mt-1"
                placeholder="00:00.000"
                value={editForm.best_lap_time}
                onChange={(e) => setEditForm({ ...editForm, best_lap_time: e.target.value })}
              />
            </div>
            <div>
              <Label>Tempo Total</Label>
              <Input
                className="racing-input mt-1"
                placeholder="00:00.000"
                value={editForm.total_time}
                onChange={(e) => setEditForm({ ...editForm, total_time: e.target.value })}
              />
            </div>
            <div>
              <Label>Gap para Líder</Label>
              <Input
                className="racing-input mt-1"
                placeholder="+0.000"
                value={editForm.gap_to_leader}
                onChange={(e) => setEditForm({ ...editForm, gap_to_leader: e.target.value })}
              />
            </div>
            <div>
              <Label>Gap para Anterior</Label>
              <Input
                className="racing-input mt-1"
                placeholder="+0.000"
                value={editForm.gap_to_previous}
                onChange={(e) => setEditForm({ ...editForm, gap_to_previous: e.target.value })}
              />
            </div>
            <div>
              <Label>Velocidade Média (km/h)</Label>
              <Input
                type="number"
                step="0.01"
                className="racing-input mt-1"
                value={editForm.average_speed}
                onChange={(e) => setEditForm({ ...editForm, average_speed: e.target.value })}
              />
            </div>
            <div>
              <Label>Total de Voltas</Label>
              <Input
                type="number"
                className="racing-input mt-1"
                value={editForm.total_laps}
                onChange={(e) => setEditForm({ ...editForm, total_laps: e.target.value })}
              />
            </div>
            <div>
              <Label>Pontos</Label>
              <Input
                type="number"
                className="racing-input mt-1"
                value={editForm.points}
                onChange={(e) => setEditForm({ ...editForm, points: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between pt-6">
              <Label>Pagamento Confirmado</Label>
              <Switch
                checked={editForm.payment_status}
                onCheckedChange={(checked) => setEditForm({ ...editForm, payment_status: checked })}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setEditingResult(null)}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 racing-gradient-red text-white font-semibold"
              onClick={handleSave}
              disabled={updateResult.isPending}
            >
              {updateResult.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
