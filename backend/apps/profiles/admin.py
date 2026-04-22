from django.contrib import admin

from .models import Profile


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ["username", "full_name", "is_pro_member", "created_at"]
    search_fields = ["username", "full_name", "user__email"]
    raw_id_fields = ["user"]
