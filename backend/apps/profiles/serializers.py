from rest_framework import serializers

from .models import Profile


class ProfilePublicSerializer(serializers.ModelSerializer):
    """Campos públicos — sem weight, sem dados sensíveis."""

    id = serializers.UUIDField(source="user_id", read_only=True)

    class Meta:
        model = Profile
        fields = [
            "id",
            "username",
            "full_name",
            "avatar_url",
            "bio",
            "is_pro_member",
            "instagram",
            "youtube",
            "tiktok",
            "website",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ProfileFullSerializer(ProfilePublicSerializer):
    """Inclui weight — retornado somente para usuários autorizados."""

    class Meta(ProfilePublicSerializer.Meta):
        fields = ProfilePublicSerializer.Meta.fields + ["weight"]


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = [
            "username",
            "full_name",
            "avatar_url",
            "weight",
            "bio",
            "is_pro_member",
            "instagram",
            "youtube",
            "tiktok",
            "website",
        ]
