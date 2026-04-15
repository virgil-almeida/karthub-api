import { useState, useEffect, useRef } from "react";
import { useUpdateChampionship, useDeleteChampionship } from "@/hooks/useChampionships";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Trash2, Save, Upload, Link as LinkIcon, ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Championship } from "@/types/kart";

interface ChampionshipManageDialogProps {
  championship: Championship | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChampionshipManageDialog({ 
  championship, 
  open, 
  onOpenChange 
}: ChampionshipManageDialogProps) {
  const updateChampionship = useUpdateChampionship();
  const deleteChampionship = useDeleteChampionship();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editForm, setEditForm] = useState({
    name: "",
    rules_summary: "",
    is_private: false,
    logo_url: "",
  });

  const [logoMode, setLogoMode] = useState<"upload" | "link">("upload");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (championship) {
      setEditForm({
        name: championship.name || "",
        rules_summary: championship.rules_summary || "",
        is_private: championship.is_private || false,
        logo_url: championship.logo_url || "",
      });
      setLogoPreview(championship.logo_url || null);
      setLogoFile(null);
      setLogoMode(championship.logo_url ? "link" : "upload");
    }
  }, [championship]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({ title: "Formato inválido. Use JPG, PNG ou WebP.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem muito grande. Máximo 5MB.", variant: "destructive" });
      return;
    }

    setLogoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setEditForm({ ...editForm, logo_url: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!championship) return;
    
    if (!editForm.name.trim()) {
      toast({ title: "Nome é obrigatório", variant: "destructive" });
      return;
    }

    try {
      setIsUploading(true);
      let finalLogoUrl: string | null = editForm.logo_url || null;

      if (logoMode === "upload" && logoFile) {
        const fileExt = logoFile.name.split(".").pop();
        const filePath = `${championship.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("championship-logos")
          .upload(filePath, logoFile);
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage
          .from("championship-logos")
          .getPublicUrl(filePath);
        finalLogoUrl = urlData.publicUrl;
      } else if (logoMode === "upload" && !logoFile && !logoPreview) {
        finalLogoUrl = null;
      }

      await updateChampionship.mutateAsync({
        id: championship.id,
        name: editForm.name,
        rules_summary: editForm.rules_summary || null,
        is_private: editForm.is_private,
        logo_url: finalLogoUrl,
      });
      toast({ title: "Campeonato atualizado com sucesso!" });
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Erro ao atualizar campeonato", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!championship) return;
    
    try {
      await deleteChampionship.mutateAsync(championship.id);
      toast({ title: "Campeonato excluído com sucesso!" });
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Erro ao excluir campeonato", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="stat-card border-border max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-racing text-xl">Gerenciar Campeonato</DialogTitle>
          <DialogDescription>
            Edite as informações do campeonato ou exclua-o permanentemente
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Nome do Campeonato</Label>
            <Input
              className="racing-input mt-1"
              placeholder="Ex: Campeonato Paulista 2025"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
          </div>
          
          <div>
            <Label>Logo do Campeonato</Label>
            <Tabs value={logoMode} onValueChange={(v) => setLogoMode(v as "upload" | "link")} className="mt-1">
              <TabsList className="w-full">
                <TabsTrigger value="upload" className="flex-1 gap-1">
                  <Upload className="w-3 h-3" /> Upload
                </TabsTrigger>
                <TabsTrigger value="link" className="flex-1 gap-1">
                  <LinkIcon className="w-3 h-3" /> Link
                </TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Selecionar imagem
                </Button>
                <p className="text-xs text-muted-foreground">JPG, PNG ou WebP • Máx. 5MB</p>
              </TabsContent>
              <TabsContent value="link" className="space-y-2">
                <Input
                  className="racing-input"
                  placeholder="https://..."
                  value={editForm.logo_url}
                  onChange={(e) => {
                    setEditForm({ ...editForm, logo_url: e.target.value });
                    setLogoPreview(e.target.value || null);
                  }}
                />
              </TabsContent>
            </Tabs>

            {logoPreview && (
              <div className="relative mt-2 inline-block">
                <img
                  src={logoPreview}
                  alt="Preview do logo"
                  className="h-20 w-20 rounded-md object-cover border border-border"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
          
          <div>
            <Label>Resumo das Regras</Label>
            <Textarea
              className="racing-input mt-1"
              placeholder="Descreva as regras principais..."
              value={editForm.rules_summary}
              onChange={(e) => setEditForm({ ...editForm, rules_summary: e.target.value })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label>Campeonato Privado</Label>
              <p className="text-xs text-muted-foreground">Apenas convidados podem participar</p>
            </div>
            <Switch
              checked={editForm.is_private}
              onCheckedChange={(checked) => setEditForm({ ...editForm, is_private: checked })}
            />
          </div>
          
          <div className="flex gap-2 pt-4 border-t border-border">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="flex-1"
                  disabled={deleteChampionship.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="stat-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Campeonato?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação é irreversível. Todos os dados associados (etapas, baterias, resultados) serão permanentemente excluídos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Sim, Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button 
              className="flex-1 racing-gradient text-white font-semibold"
              onClick={handleSave}
              disabled={updateChampionship.isPending || isUploading}
            >
              <Save className="w-4 h-4 mr-2" />
              {isUploading ? "Enviando..." : updateChampionship.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
