from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User, UserRole
from apps.accounts.permissions import IsAdminTier, IsModeratorOrHigher
from apps.accounts.serializers import UserMeSerializer, UserTierUpdateSerializer

from .models import FeatureVisibility
from .serializers import FeatureVisibilitySerializer


class FeatureVisibilityListView(APIView):
    """GET /api/v1/admin/feature-visibility/ — público."""

    permission_classes = [AllowAny]

    def get(self, request):
        features = FeatureVisibility.objects.all()
        return Response(FeatureVisibilitySerializer(features, many=True).data)


class FeatureVisibilityDetailView(APIView):
    """PATCH /api/v1/admin/feature-visibility/{id}/ — somente admin."""

    permission_classes = [IsAdminTier]

    def patch(self, request, pk):
        feature = get_object_or_404(FeatureVisibility, pk=pk)
        serializer = FeatureVisibilitySerializer(feature, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AdminUserListView(APIView):
    """GET /api/v1/admin/users/ — moderador+ lista todos os usuários."""

    permission_classes = [IsModeratorOrHigher]

    def get(self, request):
        users = User.objects.select_related("role", "profile").order_by("-date_joined")
        return Response(UserMeSerializer(users, many=True).data)


class AdminUserTierView(APIView):
    """PATCH /DELETE /api/v1/admin/users/{id}/tier/"""

    permission_classes = [IsModeratorOrHigher]

    def patch(self, request, user_pk):
        user = get_object_or_404(User, pk=user_pk)
        role, _ = UserRole.objects.get_or_create(user=user)
        serializer = UserTierUpdateSerializer(role, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user)
        return Response(UserMeSerializer(user).data)

    def delete(self, request, user_pk):
        user = get_object_or_404(User, pk=user_pk)
        role, _ = UserRole.objects.get_or_create(user=user)
        role.tier = "free"
        role.expires_at = None
        role.updated_by = request.user
        role.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
