from rest_framework import serializers

from .models import StandaloneRace, StandaloneRaceTelemetry


class StandaloneRaceTelemetrySerializer(serializers.ModelSerializer):
    standalone_race_id = serializers.UUIDField(required=False)

    class Meta:
        model = StandaloneRaceTelemetry
        fields = [
            "id",
            "standalone_race_id",
            "lap_number",
            "lap_time",
            "kart_number",
            "gap_to_best",
            "gap_to_leader",
            "total_time",
            "average_speed",
            "sector1",
            "sector2",
            "sector3",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class StandaloneRaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = StandaloneRace
        fields = [
            "id",
            "user_id",
            "race_type",
            "track_name",
            "date",
            "position",
            "kart_number",
            "total_laps",
            "best_lap_time",
            "total_time",
            "average_speed",
            "gap_to_leader",
            "points",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user_id", "created_at", "updated_at"]
