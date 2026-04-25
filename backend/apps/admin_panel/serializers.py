from rest_framework import serializers

from apps.accounts.models import User, UserRole
from .models import FeatureVisibility


class FeatureVisibilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureVisibility
        fields = ["id", "feature_key", "min_tier", "label", "created_at"]
        read_only_fields = ["id", "feature_key", "created_at"]


class UserRoleAdminSerializer(serializers.ModelSerializer):
    user_id = serializers.UUIDField(source="user.id", read_only=True)
    updated_by = serializers.UUIDField(source="updated_by_id", allow_null=True, read_only=True)

    class Meta:
        model = UserRole
        fields = [
            "id", "user_id", "role", "tier",
            "expires_at", "created_at", "updated_at", "updated_by",
        ]


class AdminUserSerializer(serializers.ModelSerializer):
    role = UserRoleAdminSerializer(read_only=True)
    username = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(source="date_joined", read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "username", "full_name", "avatar_url", "created_at", "role"]

    def get_username(self, obj):
        p = getattr(obj, "profile", None)
        return p.username if p else None

    def get_full_name(self, obj):
        p = getattr(obj, "profile", None)
        return p.full_name if p else None

    def get_avatar_url(self, obj):
        p = getattr(obj, "profile", None)
        return p.avatar_url if p else None
