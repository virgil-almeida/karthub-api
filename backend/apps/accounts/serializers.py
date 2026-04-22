from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import SubscriptionTier, User, UserRole


class UserRoleSerializer(serializers.ModelSerializer):
    effective_tier = serializers.CharField(read_only=True)
    is_admin = serializers.BooleanField(read_only=True)
    can_view_analytics = serializers.BooleanField(read_only=True)
    can_create_championships = serializers.BooleanField(read_only=True)

    class Meta:
        model = UserRole
        fields = [
            "tier",
            "effective_tier",
            "expires_at",
            "is_admin",
            "can_view_analytics",
            "can_create_championships",
        ]


class UserMeSerializer(serializers.ModelSerializer):
    role = UserRoleSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "email", "role"]


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["email", "password", "password_confirm"]

    def validate(self, attrs: dict) -> dict:
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "As senhas não coincidem."})
        return attrs

    def create(self, validated_data: dict) -> User:
        validated_data.pop("password_confirm")
        return User.objects.create_user(**validated_data)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adiciona dados do usuário na resposta de login."""

    def validate(self, attrs: dict) -> dict:
        data = super().validate(attrs)
        data["user"] = UserMeSerializer(self.user).data
        return data


class UserTierUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserRole
        fields = ["tier", "expires_at"]

    def validate_tier(self, value: str) -> str:
        if value not in SubscriptionTier.values:
            raise serializers.ValidationError(f"Tier inválido: {value}")
        return value
