import { useState, useRef } from "react";
import { Award, Plus, Trash2, UserPlus, Upload, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  useBadgeDefinitions,
  useCreateBadgeDefinition,
  useUpdateBadgeDefinition,
  useDeleteBadgeDefinition,
  type BadgeDefinition,
} from "@/hooks/useBadgeDefinitions";
import { useAssignedBadges, useAssignBadge, useRemoveBadge } from "@/hooks/useBadgeAssignment";
import { useProfiles } from "@/hooks/useProfiles";
import { useChampionships } from "@/hooks/useChampionships";
import { getIconComponent, getColorClasses, AVAILABLE_ICONS, AVAILABLE_COLORS } from "@/lib/iconMapper";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function BadgesManager() {
  const { data: badges = [], isLoading } = useBadgeDefinitions();
  const { data: assigned = [] } = useAssignedBadges();
  const { data: profiles = [] } = useProfiles();
  const { data: championships = [] } = useChampionships();

  const createMutation = useCreateBadgeDefinition();
  const updateMutation = useUpdateBadgeDefinition();
  const deleteMutation = useDeleteBadgeDefinition();
  const assignMutation = useAssignBadge();
  const removeMutation = useRemoveBadge();

  const [defDialogOpen, setDefDialogOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeDefinition | null>(null);

  // Definition form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [iconName, setIconName] = useState("award");
  const [color, setColor] = useState("yellow");
  const [isAutomatic, setIsAutomatic] = useState(false);
  const [autoCondition, setAutoCondition] = useState("");
  const [champId, setChampId] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const [useCustomImage, setUseCustomImage] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Assignment form state
  const [assignProfileId, setAssignProfileId] = useState("");
  const [assignBadgeId, setAssignBadgeId] = useState("");
  const [assignNotes, setAssignNotes] = useState("");

  function resetDefForm() {
    setName(""); setDescription(""); setIconName("award"); setColor("yellow");
    setIsAutomatic(false); setAutoCondition(""); setChampId(""); setEditingBadge(null);
    setShowPreview(true); setUseCustomImage(false); setCustomImageUrl("");
  }

  function openEditDialog(badge: BadgeDefinition) {
    setEditingBadge(badge);
    setName(badge.name);
    setDescription(badge.description || "");
    setIconName(badge.icon_name);
    setColor(badge.color);
    setIsAutomatic(badge.is_automatic ?? false);
    setAutoCondition(badge.auto_condition || "");
    setChampId(badge.championship_id || "");
    setShowPreview(badge.show_preview ?? true);
    setUseCustomImage(!!badge.custom_image_url);
    setCustomImageUrl(badge.custom_image_url || "");
    setDefDialogOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Formato não suportado. Use JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 2MB.");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("badge-images")
        .upload(fileName, file, { contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("badge-images")
        .getPublicUrl(fileName);
      setCustomImageUrl(urlData.publicUrl);
      toast.success("Imagem enviada!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar imagem");
    } finally {
      setUploading(false);
    }
  }

  function handleSaveDefinition() {
    const payload = {
      name,
      description: description || undefined,
      icon_name: iconName,
      color,
      is_automatic: isAutomatic,
      auto_condition: autoCondition || undefined,
      championship_id: champId || undefined,
      show_preview: showPreview,
      custom_image_url: useCustomImage && customImageUrl ? customImageUrl : undefined,
    };

    // If switching from image back to icon, clear the custom_image_url
    const finalPayload = editingBadge && !useCustomImage
      ? { ...payload, custom_image_url: null as any }
      : payload;

    if (editingBadge) {
      updateMutation.mutate({ id: editingBadge.id, ...finalPayload }, {
        onSuccess: () => { setDefDialogOpen(false); resetDefForm(); },
      });
    } else {
      createMutation.mutate(finalPayload, {
        onSuccess: () => { setDefDialogOpen(false); resetDefForm(); },
      });
    }
  }

  function handleAssign() {
    const badge = badges.find(b => b.id === assignBadgeId);
    if (!badge) return;
    assignMutation.mutate({
      profile_id: assignProfileId,
      badge_definition_id: assignBadgeId,
      badge_name: badge.name,
      badge_type: badge.icon_name,
      championship_id: badge.championship_id || undefined,
      notes: assignNotes || undefined,
    }, {
      onSuccess: () => { setAssignProfileId(""); setAssignBadgeId(""); setAssignNotes(""); },
    });
  }

  const getProfileName = (id: string) => {
    const p = profiles.find(p => p.id === id);
    return p?.full_name || p?.username || id.slice(0, 8);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section A: Badge Definitions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-racing-yellow" />
            <h3 className="font-racing text-lg font-bold">Definições de Badges</h3>
          </div>
          <Dialog open={defDialogOpen} onOpenChange={(open) => { setDefDialogOpen(open); if (!open) resetDefForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Novo Badge
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingBadge ? "Editar Badge" : "Criar Badge"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nome *</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Pole Position" />
                </div>
                <div>
                  <Label>Descrição</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descrição do badge" />
                </div>

                {/* Toggle: Icon vs Image */}
                <div className="flex items-center gap-3">
                  <Switch checked={useCustomImage} onCheckedChange={setUseCustomImage} />
                  <Label className="flex items-center gap-1.5">
                    <Image className="w-4 h-4" />
                    Usar imagem personalizada
                  </Label>
                </div>

                {useCustomImage ? (
                  <div className="space-y-3">
                    <div>
                      <Label>Imagem do Badge</Label>
                      <div className="flex items-center gap-3 mt-1">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="gap-2"
                        >
                          <Upload className="w-4 h-4" />
                          {uploading ? "Enviando..." : "Enviar imagem"}
                        </Button>
                        {customImageUrl && (
                          <img src={customImageUrl} alt="Preview" className="w-10 h-10 rounded object-contain border border-border" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WEBP. Máximo 2MB.</p>
                    </div>
                    <div>
                      <Label>Cor (para fundo)</Label>
                      <Select value={color} onValueChange={setColor}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_COLORS.map(c => {
                            const colors = getColorClasses(c);
                            return (
                              <SelectItem key={c} value={c}>
                                <span className={`flex items-center gap-2 ${colors.text}`}>● {c}</span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Ícone</Label>
                      <Select value={iconName} onValueChange={setIconName}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_ICONS.map(icon => {
                            const Icon = getIconComponent(icon);
                            return (
                              <SelectItem key={icon} value={icon}>
                                <span className="flex items-center gap-2">
                                  <Icon className="w-4 h-4" /> {icon}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Cor</Label>
                      <Select value={color} onValueChange={setColor}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {AVAILABLE_COLORS.map(c => {
                            const colors = getColorClasses(c);
                            return (
                              <SelectItem key={c} value={c}>
                                <span className={`flex items-center gap-2 ${colors.text}`}>● {c}</span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div>
                  <Label>Campeonato (opcional)</Label>
                  <Select value={champId} onValueChange={setChampId}>
                    <SelectTrigger><SelectValue placeholder="Universal (todos)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Universal (todos)</SelectItem>
                      {championships.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={isAutomatic} onCheckedChange={setIsAutomatic} />
                  <Label>Automático</Label>
                </div>
                {isAutomatic && (
                  <div>
                    <Label>Condição automática</Label>
                    <Input value={autoCondition} onChange={e => setAutoCondition(e.target.value)} placeholder="Ex: wins >= 5" />
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Switch checked={showPreview} onCheckedChange={setShowPreview} />
                  <Label>Mostrar pré-visualização no dashboard</Label>
                </div>
                <Button onClick={handleSaveDefinition} disabled={!name || createMutation.isPending || updateMutation.isPending || (useCustomImage && !customImageUrl)} className="w-full">
                  {editingBadge ? "Salvar Alterações" : "Criar Badge"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Badge</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Campeonato</TableHead>
                <TableHead>Preview</TableHead>
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {badges.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhum badge definido ainda
                  </TableCell>
                </TableRow>
              ) : badges.map(badge => {
                const Icon = getIconComponent(badge.icon_name);
                const colors = getColorClasses(badge.color);
                const champ = championships.find(c => c.id === badge.championship_id);
                return (
                  <TableRow key={badge.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded ${colors.bg}`}>
                          {badge.custom_image_url ? (
                            <img src={badge.custom_image_url} alt={badge.name} className="w-4 h-4 object-contain" />
                          ) : (
                            <Icon className={`w-4 h-4 ${colors.text}`} />
                          )}
                        </div>
                        <span className="font-medium">{badge.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {badge.description || "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.is_automatic ? "default" : "secondary"}>
                        {badge.is_automatic ? "Auto" : "Manual"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {champ?.name || "Universal"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badge.show_preview ? "default" : "outline"}>
                        {badge.show_preview ? "Visível" : "Oculto"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(badge)}>
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteMutation.mutate(badge.id)}
                          disabled={deleteMutation.isPending}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Separator />

      {/* Section B: Manual Assignment */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-racing-cyan" />
          <h3 className="font-racing text-lg font-bold">Atribuição Manual</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <Label>Piloto *</Label>
            <Select value={assignProfileId} onValueChange={setAssignProfileId}>
              <SelectTrigger><SelectValue placeholder="Selecionar piloto" /></SelectTrigger>
              <SelectContent>
                {profiles.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.full_name || p.username || p.id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Badge *</Label>
            <Select value={assignBadgeId} onValueChange={setAssignBadgeId}>
              <SelectTrigger><SelectValue placeholder="Selecionar badge" /></SelectTrigger>
              <SelectContent>
                {badges.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Notas</Label>
            <Input value={assignNotes} onChange={e => setAssignNotes(e.target.value)} placeholder="Opcional" />
          </div>
          <Button onClick={handleAssign} disabled={!assignProfileId || !assignBadgeId || assignMutation.isPending}>
            Atribuir
          </Button>
        </div>

        {/* Recent assignments */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Piloto</TableHead>
                <TableHead>Badge</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Notas</TableHead>
                <TableHead className="w-16">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assigned.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    Nenhum badge atribuído ainda
                  </TableCell>
                </TableRow>
              ) : assigned.map(a => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{getProfileName(a.profile_id)}</TableCell>
                  <TableCell>{a.badge_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(a.earned_at).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                    {a.notes || "—"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => removeMutation.mutate(a.id)}
                      disabled={removeMutation.isPending}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
