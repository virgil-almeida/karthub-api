from django.contrib import admin

from .models import FeatureVisibility


@admin.register(FeatureVisibility)
class FeatureVisibilityAdmin(admin.ModelAdmin):
    list_display = ["label", "feature_key", "min_tier", "created_at"]
    list_filter = ["min_tier"]
