from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Event, Heat, HeatResult, LapTelemetry
from .permissions import IsEventOrganizer
from .serializers import (
    EventSerializer,
    HeatResultFullSerializer,
    HeatResultPublicSerializer,
    HeatResultWriteSerializer,
    HeatSerializer,
    LapTelemetrySerializer,
)


def _can_see_payment_status(user, heat_result: HeatResult) -> bool:
    if _is_admin(user):
        return True
    if hasattr(user, "profile") and heat_result.driver_id == user.profile.pk:
        return True
    championship = heat_result.heat.event.championship
    return hasattr(user, "profile") and championship.organizer_id == user.profile.pk


def _is_admin(user) -> bool:
    return hasattr(user, "role") and user.role.is_admin


# ─── Events ──────────────────────────────────────────────────────────────────

class EventListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, championship_pk=None):
        qs = Event.objects.select_related("track", "championship")
        champ_id = championship_pk or request.query_params.get("championship_id")
        if champ_id:
            qs = qs.filter(championship_id=champ_id)
        return Response(EventSerializer(qs, many=True).data)

    def post(self, request, championship_pk=None):
        data = request.data.copy()
        if championship_pk:
            data["championship_id"] = str(championship_pk)
        serializer = EventSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        event = serializer.save()
        perm = IsEventOrganizer()
        if not perm.has_object_permission(request, self, event):
            event.delete()
            return Response(status=status.HTTP_403_FORBIDDEN)
        return Response(EventSerializer(event).data, status=status.HTTP_201_CREATED)


class EventDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        event = get_object_or_404(Event.objects.select_related("track", "championship"), pk=pk)
        return Response(EventSerializer(event).data)

    def patch(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        perm = IsEventOrganizer()
        if not perm.has_object_permission(request, self, event):
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = EventSerializer(event, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(EventSerializer(event).data)

    def delete(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        perm = IsEventOrganizer()
        if not perm.has_object_permission(request, self, event):
            return Response(status=status.HTTP_403_FORBIDDEN)
        event.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Heats ───────────────────────────────────────────────────────────────────

class HeatListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, event_pk):
        heats = Heat.objects.filter(event_id=event_pk)
        return Response(HeatSerializer(heats, many=True).data)

    def post(self, request, event_pk):
        event = get_object_or_404(Event, pk=event_pk)
        perm = IsEventOrganizer()
        if not perm.has_object_permission(request, self, event):
            return Response(status=status.HTTP_403_FORBIDDEN)
        data = {**request.data, "event_id": str(event_pk)}
        serializer = HeatSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        heat = serializer.save()
        return Response(HeatSerializer(heat).data, status=status.HTTP_201_CREATED)


class HeatDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        heat = get_object_or_404(Heat, pk=pk)
        return Response(HeatSerializer(heat).data)

    def patch(self, request, pk):
        heat = get_object_or_404(Heat.objects.select_related("event__championship"), pk=pk)
        perm = IsEventOrganizer()
        if not perm.has_object_permission(request, self, heat):
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = HeatSerializer(heat, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(HeatSerializer(heat).data)

    def delete(self, request, pk):
        heat = get_object_or_404(Heat.objects.select_related("event__championship"), pk=pk)
        perm = IsEventOrganizer()
        if not perm.has_object_permission(request, self, heat):
            return Response(status=status.HTTP_403_FORBIDDEN)
        heat.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Heat Results ─────────────────────────────────────────────────────────────

class HeatResultListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, heat_pk):
        results = HeatResult.objects.filter(heat_id=heat_pk).select_related("driver")
        serializer = HeatResultPublicSerializer(results, many=True)
        return Response(serializer.data)

    def post(self, request, heat_pk):
        heat = get_object_or_404(Heat.objects.select_related("event__championship"), pk=heat_pk)
        perm = IsEventOrganizer()
        if not perm.has_object_permission(request, self, heat):
            return Response(status=status.HTTP_403_FORBIDDEN)
        data = {**request.data, "heat_id": str(heat_pk)}
        serializer = HeatResultWriteSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        result = serializer.save()
        return Response(HeatResultPublicSerializer(result).data, status=status.HTTP_201_CREATED)


class HeatResultBulkCreateView(APIView):
    """POST /api/v1/heats/{heat_pk}/results/bulk/ — importação em massa (CSV)."""

    permission_classes = [IsAuthenticated]

    def post(self, request, heat_pk):
        heat = get_object_or_404(Heat.objects.select_related("event__championship"), pk=heat_pk)
        perm = IsEventOrganizer()
        if not perm.has_object_permission(request, self, heat):
            return Response(status=status.HTTP_403_FORBIDDEN)

        if not isinstance(request.data, list):
            return Response({"detail": "Esperado um array de resultados."}, status=status.HTTP_400_BAD_REQUEST)

        created = []
        errors = []
        for i, item in enumerate(request.data):
            data = {**item, "heat_id": str(heat_pk)}
            serializer = HeatResultWriteSerializer(data=data)
            if serializer.is_valid():
                created.append(serializer.save())
            else:
                errors.append({"index": i, "errors": serializer.errors})

        if errors:
            # Rollback dos criados se houver erros (opcional — pode ser parcial)
            return Response({"created": len(created), "errors": errors}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            HeatResultPublicSerializer(created, many=True).data,
            status=status.HTTP_201_CREATED,
        )


class HeatResultDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        result = get_object_or_404(
            HeatResult.objects.select_related("driver", "heat__event__championship"), pk=pk
        )
        if _can_see_payment_status(request.user, result):
            return Response(HeatResultFullSerializer(result).data)
        return Response(HeatResultPublicSerializer(result).data)

    def patch(self, request, pk):
        result = get_object_or_404(
            HeatResult.objects.select_related("heat__event__championship"), pk=pk
        )
        perm = IsEventOrganizer()
        if not perm.has_object_permission(request, self, result):
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = HeatResultWriteSerializer(result, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(HeatResultPublicSerializer(result).data)

    def delete(self, request, pk):
        result = get_object_or_404(
            HeatResult.objects.select_related("heat__event__championship"), pk=pk
        )
        perm = IsEventOrganizer()
        if not perm.has_object_permission(request, self, result):
            return Response(status=status.HTTP_403_FORBIDDEN)
        result.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class HeatResultPaymentView(APIView):
    """PATCH /api/v1/heat-results/{pk}/payment/"""

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        result = get_object_or_404(
            HeatResult.objects.select_related("heat__event__championship"), pk=pk
        )
        perm = IsEventOrganizer()
        if not perm.has_object_permission(request, self, result):
            return Response(status=status.HTTP_403_FORBIDDEN)
        result.payment_status = request.data.get("payment_status", result.payment_status)
        result.save(update_fields=["payment_status"])
        return Response({"payment_status": result.payment_status})


# ─── Lap Telemetry ────────────────────────────────────────────────────────────

class LapTelemetryListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, heat_result_pk):
        telemetry = LapTelemetry.objects.filter(heat_result_id=heat_result_pk)
        return Response(LapTelemetrySerializer(telemetry, many=True).data)

    def post(self, request, heat_result_pk):
        heat_result = get_object_or_404(
            HeatResult.objects.select_related("heat__event__championship"), pk=heat_result_pk
        )
        perm = IsEventOrganizer()
        is_own = hasattr(request.user, "profile") and heat_result.driver_id == request.user.profile.pk
        if not (perm.has_object_permission(request, self, heat_result) or is_own):
            return Response(status=status.HTTP_403_FORBIDDEN)
        data = {**request.data, "heat_result_id": str(heat_result_pk)}
        serializer = LapTelemetrySerializer(data=data)
        serializer.is_valid(raise_exception=True)
        lap = serializer.save()
        return Response(LapTelemetrySerializer(lap).data, status=status.HTTP_201_CREATED)


class LapTelemetryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        lap = get_object_or_404(
            LapTelemetry.objects.select_related("heat_result__heat__event__championship"), pk=pk
        )
        perm = IsEventOrganizer()
        if not perm.has_object_permission(request, self, lap):
            return Response(status=status.HTTP_403_FORBIDDEN)
        serializer = LapTelemetrySerializer(lap, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(LapTelemetrySerializer(lap).data)

    def delete(self, request, pk):
        lap = get_object_or_404(
            LapTelemetry.objects.select_related("heat_result__heat__event__championship"), pk=pk
        )
        perm = IsEventOrganizer()
        if not perm.has_object_permission(request, self, lap):
            return Response(status=status.HTTP_403_FORBIDDEN)
        lap.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
