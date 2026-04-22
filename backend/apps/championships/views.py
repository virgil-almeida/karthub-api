from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsPlusTierOrHigher

from .models import Championship, ChampionshipMember, MemberStatus
from .permissions import IsChampionshipOrganizer
from .serializers import (
    ChampionshipMemberSerializer,
    ChampionshipMemberUpdateSerializer,
    ChampionshipSerializer,
)


class ChampionshipListCreateView(APIView):
    """GET /api/v1/championships/ — lista pública+privados próprios; POST — cria (plus+)."""

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsPlusTierOrHigher()]
        return [IsAuthenticated()]

    def get(self, request):
        qs = Championship.objects.select_related("organizer")
        if not (hasattr(request.user, "role") and request.user.role.is_admin):
            # Filtra privados: só aparecem se o usuário é o organizador ou membro ativo
            qs = qs.filter(
                Q(is_private=False)
                | Q(organizer__user=request.user)
                | Q(members__profile__user=request.user, members__status=MemberStatus.ACTIVE)
            ).distinct()
        serializer = ChampionshipSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        data = request.data.copy()
        # Organizer padrão é o usuário atual
        if "organizer_id" not in data and hasattr(request.user, "profile"):
            data["organizer_id"] = str(request.user.profile.pk)
        serializer = ChampionshipSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ChampionshipDetailView(APIView):
    """GET /PATCH /DELETE /api/v1/championships/{id}/"""

    permission_classes = [IsAuthenticated]

    def _get_championship(self, request, pk):
        qs = Championship.objects.select_related("organizer")
        champ = get_object_or_404(qs, pk=pk)
        if champ.is_private:
            is_admin = hasattr(request.user, "role") and request.user.role.is_admin
            is_organizer = hasattr(request.user, "profile") and champ.organizer_id == request.user.profile.pk
            is_member = champ.members.filter(
                profile__user=request.user, status=MemberStatus.ACTIVE
            ).exists()
            if not (is_admin or is_organizer or is_member):
                return None
        return champ

    def get(self, request, pk):
        champ = self._get_championship(request, pk)
        if champ is None:
            return Response(status=status.HTTP_404_NOT_FOUND)
        return Response(ChampionshipSerializer(champ).data)

    def patch(self, request, pk):
        champ = get_object_or_404(Championship, pk=pk)
        perm = IsChampionshipOrganizer()
        if not perm.has_object_permission(request, self, champ):
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = ChampionshipSerializer(champ, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        champ = get_object_or_404(Championship, pk=pk)
        perm = IsChampionshipOrganizer()
        if not perm.has_object_permission(request, self, champ):
            return Response(status=status.HTTP_403_FORBIDDEN)
        champ.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MyChampionshipsView(APIView):
    """GET /api/v1/championships/mine/"""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        memberships = ChampionshipMember.objects.filter(
            profile__user=request.user,
            status=MemberStatus.ACTIVE,
        ).select_related("championship__organizer")
        championships = [m.championship for m in memberships]
        serializer = ChampionshipSerializer(championships, many=True)
        return Response(serializer.data)


class ChampionshipMemberListCreateView(APIView):
    """GET /POST /api/v1/championships/{id}/members/"""

    permission_classes = [IsAuthenticated]

    def get(self, request, championship_pk):
        champ = get_object_or_404(Championship, pk=championship_pk)
        # Visibilidade: públicos = todos autenticados; privados = membros/org/admin
        if champ.is_private:
            is_admin = hasattr(request.user, "role") and request.user.role.is_admin
            is_organizer = hasattr(request.user, "profile") and champ.organizer_id == request.user.profile.pk
            is_member = champ.members.filter(profile__user=request.user).exists()
            if not (is_admin or is_organizer or is_member):
                return Response(status=status.HTTP_403_FORBIDDEN)
        members = champ.members.select_related("profile")
        return Response(ChampionshipMemberSerializer(members, many=True).data)

    def post(self, request, championship_pk):
        champ = get_object_or_404(Championship, pk=championship_pk)
        if not hasattr(request.user, "profile"):
            return Response({"detail": "Perfil não encontrado."}, status=status.HTTP_400_BAD_REQUEST)
        member, created = ChampionshipMember.objects.get_or_create(
            championship=champ,
            profile=request.user.profile,
            defaults={"status": MemberStatus.PENDING},
        )
        return Response(
            ChampionshipMemberSerializer(member).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class ChampionshipMemberDetailView(APIView):
    """PATCH /DELETE /api/v1/championships/{id}/members/{member_id}/"""

    permission_classes = [IsAuthenticated]

    def patch(self, request, championship_pk, member_pk):
        member = get_object_or_404(
            ChampionshipMember, pk=member_pk, championship_id=championship_pk
        )
        perm = IsChampionshipOrganizer()
        if not perm.has_object_permission(request, self, member):
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = ChampionshipMemberUpdateSerializer(member, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ChampionshipMemberSerializer(member).data)

    def delete(self, request, championship_pk, member_pk):
        member = get_object_or_404(
            ChampionshipMember, pk=member_pk, championship_id=championship_pk
        )
        perm = IsChampionshipOrganizer()
        if not perm.has_object_permission(request, self, member):
            return Response(status=status.HTTP_403_FORBIDDEN)
        member.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
