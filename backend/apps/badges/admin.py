from django.contrib import admin

from .models import BadgeDefinition, DriverBadge


@admin.register(BadgeDefinition)
class BadgeDefinitionAdmin(admin.ModelAdmin):
    list_display = ["name", "icon_name", "color", "is_automatic", "show_preview"]
    list_filter = ["is_automatic", "show_preview"]
    search_fields = ["name"]


@admin.register(DriverBadge)
class DriverBadgeAdmin(admin.ModelAdmin):
    list_display = ["badge_name", "profile", "championship", "earned_at"]
    raw_id_fields = ["profile", "badge_definition", "championship", "awarded_by"]
