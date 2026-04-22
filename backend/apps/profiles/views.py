from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Profile
from .serializers import (
    ProfileFullSerializer,
    ProfilePublicSerializer,
    ProfileUpdateSerializer,
)

_ALLOWED_AVATAR_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
_MAX_AVATAR_BYTES = 2 * 1024 * 1024  # 2 MB


def _can_view_weight(requester, profile: Profile) -> bool:
    """Regra equivalente à função can_view_profile_weight() do Supabase."""
    if not requester or not requester.is_authenticated:
        return False
    if str(requester.pk) == str(profile.user_id):
        return True
    if hasattr(requester, "role") and requester.role.is_admin:
        return True
    # Organizador de campeonato onde o piloto é membro
    return profile.championship_memberships.filter(
        championship__organizer_id=requester.pk,
    ).exists()


class ProfileListView(APIView):
    """GET /api/v1/profiles/ — lista básica de perfis."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        profiles = Profile.objects.select_related("user").order_by("full_name")
        serializer = ProfilePublicSerializer(profiles, many=True)
        return Response(serializer.data)


class ProfileDetailView(APIView):
    """GET /api/v1/profiles/{id}/ — detalhe; PATCH — atualização."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        profile = get_object_or_404(Profile, user_id=pk)
        if _can_view_weight(request.user, profile):
            serializer = ProfileFullSerializer(profile)
        else:
            serializer = ProfilePublicSerializer(profile)
        return Response(serializer.data)

    def patch(self, request, pk):
        profile = get_object_or_404(Profile, user_id=pk)
        # Somente dono ou admin podem atualizar
        is_owner = str(request.user.pk) == str(pk)
        is_admin = hasattr(request.user, "role") and request.user.role.is_admin
        if not (is_owner or is_admin):
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = ProfileUpdateSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(ProfileFullSerializer(profile).data)


class ProfileCanViewWeightView(APIView):
    """GET /api/v1/profiles/{id}/can-view-weight/"""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        profile = get_object_or_404(Profile, user_id=pk)
        return Response({"can_view_weight": _can_view_weight(request.user, profile)})


class ProfileEnsureView(APIView):
    """POST /api/v1/profiles/ensure/ — cria perfil se não existir."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        profile, created = Profile.objects.get_or_create(user=request.user)
        serializer = ProfileFullSerializer(profile)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class ProfileAvatarUploadView(APIView):
    """POST /api/v1/profiles/{pk}/avatar/ — upload de avatar (multipart/form-data)."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request, pk):
        profile = get_object_or_404(Profile, user_id=pk)
        is_owner = str(request.user.pk) == str(pk)
        is_admin = hasattr(request.user, "role") and request.user.role.is_admin
        if not (is_owner or is_admin):
            return Response(status=status.HTTP_403_FORBIDDEN)

        file = request.FILES.get("avatar")
        if not file:
            return Response({"detail": "Nenhum arquivo enviado."}, status=status.HTTP_400_BAD_REQUEST)

        if file.content_type not in _ALLOWED_AVATAR_TYPES:
            return Response(
                {"detail": "Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if file.size > _MAX_AVATAR_BYTES:
            return Response(
                {"detail": "O arquivo excede o limite de 2 MB."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        profile.avatar = file
        profile.save(update_fields=["avatar"])

        return Response(
            {"avatar_url": request.build_absolute_uri(profile.avatar.url) if profile.avatar else None},
            status=status.HTTP_200_OK,
        )
