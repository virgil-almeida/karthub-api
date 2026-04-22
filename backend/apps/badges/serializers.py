from rest_framework import serializers

from .models import BadgeDefinition, DriverBadge


class BadgeDefinitionSerializer(serializers.ModelSerializer):
    # FK attnames — must be declared explicitly so DRF treats them as writable fields
    championship_id = serializers.UUIDField(required=False, allow_null=True)
    created_by_id = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = BadgeDefinition
        fields = [
            "id",
            "name",
            "description",
            "icon_name",
            "color",
            "is_automatic",
            "auto_condition",
            "championship_id",
            "created_by_id",
            "show_preview",
            "custom_image_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class DriverBadgeSerializer(serializers.ModelSerializer):
    # FK attnames — must be declared explicitly so DRF treats them as writable fields
    profile_id = serializers.UUIDField()
    badge_definition_id = serializers.UUIDField(required=False, allow_null=True)
    championship_id = serializers.UUIDField(required=False, allow_null=True)
    awarded_by_id = serializers.UUIDField(required=False, allow_null=True)

    class Meta:
        model = DriverBadge
        fields = [
            "id",
            "profile_id",
            "badge_definition_id",
            "badge_type",
            "badge_name",
            "championship_id",
            "awarded_by_id",
            "notes",
            "earned_at",
        ]
        read_only_fields = ["id", "earned_at"]
