from django.contrib import admin

from .models import StandaloneRace, StandaloneRaceTelemetry


@admin.register(StandaloneRace)
class StandaloneRaceAdmin(admin.ModelAdmin):
    list_display = ["user", "race_type", "track_name", "date", "position"]
    list_filter = ["race_type"]
    raw_id_fields = ["user"]


@admin.register(StandaloneRaceTelemetry)
class StandaloneRaceTelemetryAdmin(admin.ModelAdmin):
    list_display = ["standalone_race", "lap_number", "lap_time"]
    raw_id_fields = ["standalone_race"]
