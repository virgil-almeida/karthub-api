from django.contrib import admin

from .models import Event, Heat, HeatResult, LapTelemetry


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ["name", "championship", "date", "status"]
    list_filter = ["status"]
    raw_id_fields = ["championship", "track"]


@admin.register(Heat)
class HeatAdmin(admin.ModelAdmin):
    list_display = ["name", "event", "weather_condition", "start_time"]
    raw_id_fields = ["event"]


@admin.register(HeatResult)
class HeatResultAdmin(admin.ModelAdmin):
    list_display = ["position", "driver", "driver_name_text", "heat", "points", "payment_status"]
    list_filter = ["payment_status"]
    raw_id_fields = ["heat", "driver"]


@admin.register(LapTelemetry)
class LapTelemetryAdmin(admin.ModelAdmin):
    list_display = ["lap_number", "lap_time", "heat_result"]
    raw_id_fields = ["heat_result"]
