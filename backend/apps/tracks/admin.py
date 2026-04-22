from django.contrib import admin

from .models import Track


@admin.register(Track)
class TrackAdmin(admin.ModelAdmin):
    list_display = ["name", "location", "length_meters", "created_at"]
    search_fields = ["name", "location"]
