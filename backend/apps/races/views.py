from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import StandaloneRace, StandaloneRaceTelemetry
from .serializers import StandaloneRaceSerializer, StandaloneRaceTelemetrySerializer


class StandaloneRaceListCreateView(APIView):
    """GET /POST /api/v1/standalone-races/ — somente corridas do próprio usuário."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = StandaloneRace.objects.filter(user=request.user)
        race_type = request.query_params.get("type")
        if race_type:
            qs = qs.filter(race_type=race_type)
        return Response(StandaloneRaceSerializer(qs, many=True).data)

    def post(self, request):
        serializer = StandaloneRaceSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        race = serializer.save(user=request.user)
        return Response(StandaloneRaceSerializer(race).data, status=status.HTTP_201_CREATED)


class StandaloneRaceDetailView(APIView):
    """DELETE /api/v1/standalone-races/{id}/"""

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        race = get_object_or_404(StandaloneRace, pk=pk, user=request.user)
        race.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class StandaloneRaceTelemetryListCreateView(APIView):
    """GET /POST /api/v1/standalone-races/{race_pk}/telemetry/"""

    permission_classes = [IsAuthenticated]

    def get(self, request, race_pk):
        race = get_object_or_404(StandaloneRace, pk=race_pk, user=request.user)
        telemetry = race.telemetry.all()
        return Response(StandaloneRaceTelemetrySerializer(telemetry, many=True).data)

    def post(self, request, race_pk):
        get_object_or_404(StandaloneRace, pk=race_pk, user=request.user)
        data = {**request.data, "standalone_race_id": str(race_pk)}
        serializer = StandaloneRaceTelemetrySerializer(data=data)
        serializer.is_valid(raise_exception=True)
        lap = serializer.save()
        return Response(StandaloneRaceTelemetrySerializer(lap).data, status=status.HTTP_201_CREATED)


class StandaloneRaceTelemetryDetailView(APIView):
    """PATCH /DELETE /api/v1/standalone-race-telemetry/{id}/"""

    permission_classes = [IsAuthenticated]

    def _get_lap(self, request, pk):
        return get_object_or_404(
            StandaloneRaceTelemetry.objects.select_related("standalone_race"),
            pk=pk,
            standalone_race__user=request.user,
        )

    def patch(self, request, pk):
        lap = self._get_lap(request, pk)
        serializer = StandaloneRaceTelemetrySerializer(lap, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(StandaloneRaceTelemetrySerializer(lap).data)

    def delete(self, request, pk):
        lap = self._get_lap(request, pk)
        lap.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
