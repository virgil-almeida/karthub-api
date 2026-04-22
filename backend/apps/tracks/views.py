from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from apps.accounts.permissions import IsAdminTier

from .models import Track
from .serializers import TrackSerializer


class TrackListCreateView(generics.ListCreateAPIView):
    """GET /api/v1/tracks/ — lista; POST — cria (admin)."""

    queryset = Track.objects.all()
    serializer_class = TrackSerializer

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAdminTier()]
        return [IsAuthenticated()]


class TrackDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET /PATCH /DELETE /api/v1/tracks/{id}/"""

    queryset = Track.objects.all()
    serializer_class = TrackSerializer

    def get_permissions(self):
        if self.request.method in ("PATCH", "PUT", "DELETE"):
            return [IsAdminTier()]
        return [IsAuthenticated()]
