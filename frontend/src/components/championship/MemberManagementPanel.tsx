import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpdateMemberStatus, useRemoveMember } from "@/hooks/useMemberManagement";
import { useToast } from "@/hooks/use-toast";
import { Check, X, UserCog, Users, Clock, Ban, Trash2 } from "lucide-react";
import type { ChampionshipMember } from "@/types/kart";

interface MemberManagementPanelProps {
  championshipId: string;
  members: ChampionshipMember[];
}

export function MemberManagementPanel({ championshipId, members }: MemberManagementPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const updateStatus = useUpdateMemberStatus();
  const removeMember = useRemoveMember();
  const { toast } = useToast();

  const pendingMembers = members.filter(m => m.status === "pending");
  const activeMembers = members.filter(m => m.status === "active");
  const bannedMembers = members.filter(m => m.status === "banned");

  const handleApprove = async (memberId: string) => {
    try {
      await updateStatus.mutateAsync({ memberId, championshipId, status: "active" });
      toast({ title: "Piloto aprovado com sucesso!" });
    } catch (error) {
      toast({ title: "Erro ao aprovar piloto", variant: "destructive" });
    }
  };

  const handleReject = async (memberId: string) => {
    try {
      await removeMember.mutateAsync({ memberId, championshipId });
      toast({ title: "Solicitação rejeitada" });
    } catch (error) {
      toast({ title: "Erro ao rejeitar solicitação", variant: "destructive" });
    }
  };

  const handleBan = async (memberId: string) => {
    try {
      await updateStatus.mutateAsync({ memberId, championshipId, status: "banned" });
      toast({ title: "Piloto banido" });
    } catch (error) {
      toast({ title: "Erro ao banir piloto", variant: "destructive" });
    }
  };

  const handleUnban = async (memberId: string) => {
    try {
      await updateStatus.mutateAsync({ memberId, championshipId, status: "active" });
      toast({ title: "Piloto reativado" });
    } catch (error) {
      toast({ title: "Erro ao reativar piloto", variant: "destructive" });
    }
  };

  const handleRemove = async (memberId: string) => {
    try {
      await removeMember.mutateAsync({ memberId, championshipId });
      toast({ title: "Piloto removido" });
    } catch (error) {
      toast({ title: "Erro ao remover piloto", variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <UserCog className="w-4 h-4 mr-2" />
          Gerenciar Pilotos
          {pendingMembers.length > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {pendingMembers.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-racing text-xl">Gerenciar Pilotos</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="pending" className="mt-4">
          <TabsList className="bg-card border border-border w-full">
            <TabsTrigger value="pending" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Clock className="w-4 h-4 mr-2" />
              Pendentes ({pendingMembers.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4 mr-2" />
              Ativos ({activeMembers.length})
            </TabsTrigger>
            <TabsTrigger value="banned" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Ban className="w-4 h-4 mr-2" />
              Banidos ({bannedMembers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-3 mt-4">
            {pendingMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma solicitação pendente</p>
              </div>
            ) : (
              pendingMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold">
                      {member.profile?.full_name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="font-medium">{member.profile?.full_name || "Piloto"}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.profile?.username || "Sem username"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-racing-green text-racing-green hover:bg-racing-green/20"
                      onClick={() => handleApprove(member.id)}
                      disabled={updateStatus.isPending}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive text-destructive hover:bg-destructive/20"
                      onClick={() => handleReject(member.id)}
                      disabled={removeMember.isPending}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-3 mt-4">
            {activeMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum piloto ativo</p>
              </div>
            ) : (
              activeMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold">
                      {member.profile?.full_name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="font-medium">{member.profile?.full_name || "Piloto"}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.role === "organizer" ? "Organizador" : member.role === "admin" ? "Admin" : "Piloto"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="border-orange-500 text-orange-500 hover:bg-orange-500/20">
                          <Ban className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Banir piloto?</AlertDialogTitle>
                          <AlertDialogDescription>
                            O piloto será banido do campeonato e não poderá mais participar.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleBan(member.id)}>Banir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" className="border-destructive text-destructive hover:bg-destructive/20">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover piloto?</AlertDialogTitle>
                          <AlertDialogDescription>
                            O piloto será removido do campeonato. Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleRemove(member.id)}>Remover</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="banned" className="space-y-3 mt-4">
            {bannedMembers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Ban className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum piloto banido</p>
              </div>
            ) : (
              bannedMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center text-sm font-bold text-destructive">
                      {member.profile?.full_name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="font-medium">{member.profile?.full_name || "Piloto"}</p>
                      <Badge variant="destructive" className="text-xs">Banido</Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-racing-green text-racing-green hover:bg-racing-green/20"
                    onClick={() => handleUnban(member.id)}
                    disabled={updateStatus.isPending}
                  >
                    Reativar
                  </Button>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
