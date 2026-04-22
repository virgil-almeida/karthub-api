from rest_framework import serializers

from apps.accounts.serializers import UserMeSerializer

from .models import FeatureVisibility


class FeatureVisibilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = FeatureVisibility
        fields = ["id", "feature_key", "min_tier", "label", "created_at"]
        read_only_fields = ["id", "feature_key", "created_at"]


class UserWithRoleSerializer(UserMeSerializer):
    """Serializer expandido para listagem admin de usuários."""

    class Meta(UserMeSerializer.Meta):
        fields = UserMeSerializer.Meta.fields + []
