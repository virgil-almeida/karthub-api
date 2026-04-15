import { useState } from "react";
import { useProfiles } from "@/hooks/useProfiles";
import { useAdminUpdateProfile } from "@/hooks/useAdminMutations";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users, Pencil, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { PublicProfile } from "@/hooks/useProfiles";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ProfilesManager() {
  const { data: profiles, isLoading } = useProfiles();
  const updateProfile = useAdminUpdateProfile();
  const { toast } = useToast();

  const [search, setSearch] = useState("");
  const [editingProfile, setEditingProfile] = useState<PublicProfile | null>(null);
  const [editForm, setEditForm] = useState({
    username: "",
    full_name: "",
    avatar_url: "",
    bio: "",
    is_pro_member: false,
  });

  const filteredProfiles = profiles?.filter(
    (p) =>
      p.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      p.username?.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (profile: PublicProfile) => {
    setEditingProfile(profile);
    setEditForm({
      username: profile.username || "",
      full_name: profile.full_name || "",
      avatar_url: profile.avatar_url || "",
      bio: profile.bio || "",
      is_pro_member: profile.is_pro_member || false,
    });
  };

  const handleSave = async () => {
    if (!editingProfile) return;

    try {
      await updateProfile.mutateAsync({
        id: editingProfile.id,
        ...editForm,
      });
      toast({ title: "Perfil atualizado com sucesso!" });
      setEditingProfile(null);
    } catch (error) {
      toast({ title: "Erro ao atualizar perfil", variant: "destructive" });
    }
  };

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-racing-red" />
          <h2 className="font-racing text-xl font-bold">Gestão de Usuários</h2>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuário..."
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
      ) : filteredProfiles && filteredProfiles.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Membro Pro</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProfiles.map((profile) => (
              <TableRow key={profile.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback>
                        {profile.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{profile.full_name || "—"}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {profile.username || "—"}
                </TableCell>
                <TableCell>
                  {profile.is_pro_member ? (
                    <span className="text-xs px-2 py-1 rounded bg-racing-red/20 text-racing-red font-semibold">
                      PRO
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Não</span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {format(new Date(profile.created_at), "dd MMM yyyy", { locale: ptBR })}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(profile)}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">Nenhum usuário encontrado</p>
        </div>
      )}

      {/* Edit Profile Dialog */}
      <Dialog open={!!editingProfile} onOpenChange={(open) => !open && setEditingProfile(null)}>
        <DialogContent className="stat-card border-border">
          <DialogHeader>
            <DialogTitle className="font-racing text-xl">Editar Perfil</DialogTitle>
            <DialogDescription>
              Altere os dados do usuário
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome Completo</Label>
              <Input
                className="racing-input mt-1"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label>Username</Label>
              <Input
                className="racing-input mt-1"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
              />
            </div>
            <div>
              <Label>URL do Avatar</Label>
              <Input
                className="racing-input mt-1"
                value={editForm.avatar_url}
                onChange={(e) => setEditForm({ ...editForm, avatar_url: e.target.value })}
              />
            </div>
            <div>
              <Label>Bio</Label>
              <Textarea
                className="racing-input mt-1"
                value={editForm.bio}
                onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Membro Pro</Label>
              <Switch
                checked={editForm.is_pro_member}
                onCheckedChange={(checked) => setEditForm({ ...editForm, is_pro_member: checked })}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditingProfile(null)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 racing-gradient-red text-white font-semibold"
                onClick={handleSave}
                disabled={updateProfile.isPending}
              >
                {updateProfile.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
