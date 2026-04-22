from django.contrib import admin

from .models import Championship, ChampionshipMember


@admin.register(Championship)
class ChampionshipAdmin(admin.ModelAdmin):
    list_display = ["name", "organizer", "is_private", "created_at"]
    list_filter = ["is_private"]
    search_fields = ["name"]
    raw_id_fields = ["organizer"]


@admin.register(ChampionshipMember)
class ChampionshipMemberAdmin(admin.ModelAdmin):
    list_display = ["profile", "championship", "status", "role", "joined_at"]
    list_filter = ["status", "role"]
    raw_id_fields = ["championship", "profile"]
