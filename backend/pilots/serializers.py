from rest_framework import serializers
from .models import PilotProfile, Track, Race

#conversão python-json
class PilotProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = PilotProfile
        fields = ['id', 'name']

class TrackSerializer(serializers.ModelSerializer):
    class Meta:
        model = Track
        fields = ['id', 'name', 'location']

class RaceSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Race
        fields = [
            'id',
            'pilot',
            'track',
            'race_date',
            'category',
            'modality',
            'position_finished',
            'total_competitors',
            'best_lap_time',
            'total_time',
            'notes',
            'is_public',
        ]