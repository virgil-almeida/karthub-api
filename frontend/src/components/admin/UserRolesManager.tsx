import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { 
  useAllUsersWithRoles, 
  useUpdateUserTier, 
  useResetUserTier,
  tierConfig,
  getDaysRemaining,
  isTierExpired,
  SubscriptionTier,
  UserWithRole
} from "@/hooks/useUserRoles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Users, 
  Edit, 
  Calendar,
  Clock,
  AlertTriangle,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function UserRolesManager() {
  const { user } = useAuth();
  const { data: users, isLoading } = useAllUsersWithRoles();
  const updateTier = useUpdateUserTier();
  const resetTier = useResetUserTier();
  const { toast } = useToast();

  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('free');
  const [expirationMode, setExpirationMode] = useState<'none' | 'date' | 'days'>('none');
  const [expirationDate, setExpirationDate] = useState('');
  const [expirationDays, setExpirationDays] = useState('30');
  const [searchQuery, setSearchQuery] = useState('');

  const openEditDialog = (userToEdit: UserWithRole) => {
    setEditingUser(userToEdit);
    setSelectedTier(userToEdit.role?.tier || 'free');
    if (userToEdit.role?.expires_at) {
      setExpirationMode('date');
      setExpirationDate(userToEdit.role.expires_at.split('T')[0]);
    } else {
      setExpirationMode('none');
      setExpirationDate('');
    }
    setExpirationDays('30');
  };

  const handleSave = async () => {
    if (!editingUser) return;

    let expiresAt: Date | null = null;
    
    if (expirationMode === 'date' && expirationDate) {
      expiresAt = new Date(expirationDate);
    } else if (expirationMode === 'days' && expirationDays) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expirationDays));
    }

    try {
      await updateTier.mutateAsync({
        userId: editingUser.id,
        tier: selectedTier,
        expiresAt,
      });
      toast({ title: "Tier atualizado com sucesso!" });
      setEditingUser(null);
    } catch (error) {
      toast({ title: "Erro ao atualizar tier", variant: "destructive" });
    }
  };

  const handleReset = async (userId: string) => {
    try {
      await resetTier.mutateAsync(userId);
      toast({ title: "Tier resetado para Free" });
    } catch (error) {
      toast({ title: "Erro ao resetar tier", variant: "destructive" });
    }
  };

  const filteredUsers = users?.filter(u => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(query) ||
      u.username?.toLowerCase().includes(query)
    );
  });

  const getExpirationBadge = (userWithRole: UserWithRole) => {
    if (!userWithRole.role?.expires_at) return null;
    
    const days = getDaysRemaining(userWithRole.role.expires_at);
    const expired = isTierExpired(userWithRole.role.expires_at);
    
    if (expired) {
      return (
        <Badge variant="destructive" className="ml-2 text-xs">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Expirado
        </Badge>
      );
    }
    
    if (days !== null && days <= 7) {
      return (
        <Badge variant="outline" className="ml-2 text-xs border-racing-orange text-racing-orange">
          <Clock className="w-3 h-3 mr-1" />
          {days}d restantes
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className="ml-2 text-xs">
        <Calendar className="w-3 h-3 mr-1" />
        {new Date(userWithRole.role.expires_at).toLocaleDateString('pt-BR')}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-racing-red" />
          <h2 className="font-racing text-xl font-bold">Gestão de Usuários</h2>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuário..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 racing-input"
          />
        </div>
      </div>

      {filteredUsers && filteredUsers.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Data Cadastro</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((userRow) => {
              const tier = userRow.role?.tier || 'free';
              const config = tierConfig[tier];
              const isCurrentUser = userRow.id === user?.id;
              
              return (
                <TableRow key={userRow.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={userRow.avatar_url || undefined} />
                        <AvatarFallback className="bg-muted text-xs">
                          {(userRow.full_name || userRow.username || 'U')[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {userRow.full_name || userRow.username || "Sem nome"}
                        </p>
                        {userRow.username && userRow.full_name && (
                          <p className="text-xs text-muted-foreground">@{userRow.username}</p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Badge className={cn("border", config.color)}>
                        {config.label}
                      </Badge>
                      {getExpirationBadge(userRow)}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(userRow.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(userRow)}
                      disabled={isCurrentUser && tier === 'admin'}
                      title={isCurrentUser && tier === 'admin' ? "Não pode editar próprio tier de admin" : "Editar tier"}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground">
            {searchQuery ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
          </p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="stat-card border-border">
          <DialogHeader>
            <DialogTitle className="font-racing text-xl">Editar Tier do Usuário</DialogTitle>
            <DialogDescription>
              Defina o tier e a data de expiração para {editingUser?.full_name || editingUser?.username}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Tier</Label>
              <Select value={selectedTier} onValueChange={(v) => setSelectedTier(v as SubscriptionTier)}>
                <SelectTrigger className="racing-input mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(tierConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <Badge className={cn("border", config.color)}>{config.label}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Expiração</Label>
              <Select value={expirationMode} onValueChange={(v) => setExpirationMode(v as 'none' | 'date' | 'days')}>
                <SelectTrigger className="racing-input mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem expiração (permanente)</SelectItem>
                  <SelectItem value="date">Data específica</SelectItem>
                  <SelectItem value="days">Período em dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {expirationMode === 'date' && (
              <div>
                <Label>Data de Expiração</Label>
                <Input
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="racing-input mt-1"
                />
              </div>
            )}

            {expirationMode === 'days' && (
              <div>
                <Label>Dias a partir de hoje</Label>
                <Input
                  type="number"
                  value={expirationDays}
                  onChange={(e) => setExpirationDays(e.target.value)}
                  min="1"
                  className="racing-input mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Expira em: {new Date(Date.now() + parseInt(expirationDays || '0') * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditingUser(null)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1 racing-gradient-red text-white font-semibold"
                onClick={handleSave}
                disabled={updateTier.isPending}
              >
                {updateTier.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
