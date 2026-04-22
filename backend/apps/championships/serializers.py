from rest_framework import serializers

from apps.profiles.serializers import ProfilePublicSerializer

from .models import Championship, ChampionshipMember


class ChampionshipSerializer(serializers.ModelSerializer):
    organizer = ProfilePublicSerializer(read_only=True)
    organizer_id = serializers.UUIDField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Championship
        fields = [
            "id",
            "name",
            "organizer",
            "organizer_id",
            "rules_summary",
            "is_private",
            "logo_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ChampionshipMemberSerializer(serializers.ModelSerializer):
    profile = ProfilePublicSerializer(read_only=True)

    class Meta:
        model = ChampionshipMember
        fields = ["id", "championship_id", "profile", "status", "role", "joined_at"]
        read_only_fields = ["id", "joined_at"]


class ChampionshipMemberUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChampionshipMember
        fields = ["status", "role"]
