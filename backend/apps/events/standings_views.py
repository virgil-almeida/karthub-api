from django.db.models import Avg, Case, Count, IntegerField, Min, Sum, When
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.profiles.models import Profile
from apps.profiles.serializers import ProfilePublicSerializer

from .models import HeatResult


def _build_standings(heat_results_qs):
    """
    Agrega estatísticas de corrida a partir de um QuerySet de HeatResult.
    Retorna lista ordenada por pontos totais (desc) → vitórias (desc).
    """
    aggregated = (
        heat_results_qs.filter(driver__isnull=False)
        .values("driver_id")
        .annotate(
            total_points=Sum("points"),
            total_races=Count("id"),
            wins=Sum(Case(When(position=1, then=1), default=0, output_field=IntegerField())),
            podiums=Sum(
                Case(When(position__lte=3, then=1), default=0, output_field=IntegerField())
            ),
            fastest_laps=Sum(
                Case(When(best_lap_time__isnull=False, then=1), default=0, output_field=IntegerField())
            ),
            best_position=Min("position"),
            avg_position=Avg("position"),
        )
        .order_by("-total_points", "-wins")
    )

    driver_ids = [row["driver_id"] for row in aggregated]
    profiles = {
        p.user_id: p
        for p in Profile.objects.filter(user_id__in=driver_ids)
    }

    result = []
    for row in aggregated:
        profile = profiles.get(row["driver_id"])
        if profile is None:
            continue
        result.append(
            {
                "profile": ProfilePublicSerializer(profile).data,
                "stats": {
                    "totalRaces": row["total_races"],
                    "wins": row["wins"] or 0,
                    "podiums": row["podiums"] or 0,
                    "bestPosition": row["best_position"],
                    "averagePosition": round(float(row["avg_position"] or 0), 2),
                    "totalPoints": row["total_points"] or 0,
                    "fastestLaps": row["fastest_laps"] or 0,
                },
            }
        )

    return result


class StandingsView(APIView):
    """GET /api/v1/standings/ — classificação geral de todos os pilotos."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(_build_standings(HeatResult.objects.all()))


class ChampionshipStandingsView(APIView):
    """GET /api/v1/championships/{pk}/standings/ — classificação de um campeonato."""

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        qs = HeatResult.objects.filter(heat__event__championship_id=pk)
        return Response(_build_standings(qs))
