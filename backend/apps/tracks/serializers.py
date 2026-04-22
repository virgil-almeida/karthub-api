from rest_framework import serializers

from .models import Track


class TrackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Track
        fields = ["id", "name", "location", "length_meters", "map_image_url", "created_at"]
        read_only_fields = ["id", "created_at"]
