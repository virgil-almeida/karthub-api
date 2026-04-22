from rest_framework import serializers

from apps.profiles.serializers import ProfilePublicSerializer
from apps.tracks.serializers import TrackSerializer

from .models import Event, Heat, HeatResult, LapTelemetry


class EventSerializer(serializers.ModelSerializer):
    track = TrackSerializer(read_only=True)
    track_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)
    # championship_id é attname de FK — DRF o trata como propriedade read-only se não declarado
    championship_id = serializers.UUIDField(required=False)
    championship_name = serializers.CharField(source="championship.name", read_only=True)

    class Meta:
        model = Event
        fields = [
            "id",
            "championship_id",
            "championship_name",
            "track",
            "track_id",
            "name",
            "date",
            "status",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class HeatSerializer(serializers.ModelSerializer):
    event_id = serializers.UUIDField(required=False)

    class Meta:
        model = Heat
        fields = ["id", "event_id", "name", "weather_condition", "start_time", "created_at"]
        read_only_fields = ["id", "created_at"]


class LapTelemetrySerializer(serializers.ModelSerializer):
    heat_result_id = serializers.UUIDField(required=False)

    class Meta:
        model = LapTelemetry
        fields = [
            "id",
            "heat_result_id",
            "lap_number",
            "lap_time",
            "sector1",
            "sector2",
            "sector3",
            "kart_number",
            "gap_to_best",
            "gap_to_leader",
            "total_time",
            "average_speed",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class HeatResultPublicSerializer(serializers.ModelSerializer):
    """Sem payment_status — equivalente à view heat_results_public do Supabase."""

    driver = ProfilePublicSerializer(read_only=True)
    heat_id = serializers.UUIDField(required=False)

    class Meta:
        model = HeatResult
        fields = [
            "id",
            "heat_id",
            "driver",
            "driver_name_text",
            "position",
            "kart_number",
            "best_lap_time",
            "total_time",
            "gap_to_leader",
            "gap_to_previous",
            "average_speed",
            "total_laps",
            "points",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class HeatResultFullSerializer(HeatResultPublicSerializer):
    """Com payment_status — somente para admins, drivers e organizadores."""

    class Meta(HeatResultPublicSerializer.Meta):
        fields = HeatResultPublicSerializer.Meta.fields + ["payment_status"]


class HeatResultWriteSerializer(serializers.ModelSerializer):
    heat_id = serializers.UUIDField(required=False)
    driver_id = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = HeatResult
        fields = [
            "heat_id",
            "driver_id",
            "driver_name_text",
            "position",
            "kart_number",
            "best_lap_time",
            "total_time",
            "gap_to_leader",
            "gap_to_previous",
            "average_speed",
            "total_laps",
            "payment_status",
            "points",
        ]
