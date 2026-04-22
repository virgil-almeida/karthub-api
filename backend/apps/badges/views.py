from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsModeratorOrHigher

from .models import BadgeDefinition, DriverBadge
from .serializers import BadgeDefinitionSerializer, DriverBadgeSerializer


class BadgeDefinitionListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [IsModeratorOrHigher()]
        return [IsAuthenticated()]

    def get(self, request):
        definitions = BadgeDefinition.objects.all()
        return Response(BadgeDefinitionSerializer(definitions, many=True).data)

    def post(self, request):
        data = request.data.copy()
        if hasattr(request.user, "profile"):
            data.setdefault("created_by_id", str(request.user.profile.pk))
        serializer = BadgeDefinitionSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        badge_def = serializer.save()
        return Response(BadgeDefinitionSerializer(badge_def).data, status=status.HTTP_201_CREATED)


class BadgeDefinitionDetailView(APIView):
    def get_permissions(self):
        if self.request.method in ("PATCH", "PUT", "DELETE"):
            return [IsModeratorOrHigher()]
        return [IsAuthenticated()]

    def patch(self, request, pk):
        badge_def = get_object_or_404(BadgeDefinition, pk=pk)
        serializer = BadgeDefinitionSerializer(badge_def, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(BadgeDefinitionSerializer(badge_def).data)

    def delete(self, request, pk):
        badge_def = get_object_or_404(BadgeDefinition, pk=pk)
        badge_def.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DriverBadgeListCreateView(APIView):
    """GET /POST /api/v1/badges/assigned/ — moderador+ lista/atribui todos."""

    permission_classes = [IsModeratorOrHigher]

    def get(self, request):
        badges = DriverBadge.objects.select_related("profile").order_by("-earned_at")[:50]
        return Response(DriverBadgeSerializer(badges, many=True).data)

    def post(self, request):
        data = request.data.copy()
        if hasattr(request.user, "profile"):
            data.setdefault("awarded_by_id", str(request.user.profile.pk))
        serializer = DriverBadgeSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        badge = serializer.save()
        return Response(DriverBadgeSerializer(badge).data, status=status.HTTP_201_CREATED)


class DriverBadgeDeleteView(APIView):
    permission_classes = [IsModeratorOrHigher]

    def delete(self, request, pk):
        badge = get_object_or_404(DriverBadge, pk=pk)
        badge.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProfileBadgesView(APIView):
    """GET /api/v1/profiles/{profile_pk}/badges/ — badges de um piloto."""

    permission_classes = [IsAuthenticated]

    def get(self, request, profile_pk):
        badges = DriverBadge.objects.filter(profile_id=profile_pk).order_by("-earned_at")
        return Response(DriverBadgeSerializer(badges, many=True).data)
