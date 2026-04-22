import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

from .managers import UserManager


class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)

    # Remove username — login é feito por email
    username = None  # type: ignore[assignment]

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()  # type: ignore[assignment]

    class Meta:
        db_table = "users"

    def __str__(self) -> str:
        return self.email


# ─── Subscription Tier ────────────────────────────────────────────────────────

class SubscriptionTier(models.TextChoices):
    FREE = "free", "Free"
    USER = "user", "User"
    PLUS = "plus", "Plus"
    MODERATOR = "moderator", "Moderador"
    ADMIN = "admin", "Admin"


class AppRole(models.TextChoices):
    ADMIN = "admin", "Admin"
    PILOT = "pilot", "Piloto"


TIER_PRIORITY: dict[str, int] = {
    SubscriptionTier.FREE: 1,
    SubscriptionTier.USER: 2,
    SubscriptionTier.PLUS: 3,
    SubscriptionTier.MODERATOR: 4,
    SubscriptionTier.ADMIN: 5,
}


class UserRole(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="role",
    )
    role = models.CharField(
        max_length=10,
        choices=AppRole.choices,
        default=AppRole.PILOT,
    )
    tier = models.CharField(
        max_length=20,
        choices=SubscriptionTier.choices,
        default=SubscriptionTier.FREE,
    )
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
        db_column="updated_by",
    )

    class Meta:
        db_table = "user_roles"

    def __str__(self) -> str:
        return f"{self.user.email} — {self.tier}"

    @property
    def effective_tier(self) -> str:
        """Retorna FREE se o tier expirou."""
        if self.expires_at and self.expires_at < timezone.now():
            return SubscriptionTier.FREE
        return self.tier

    def has_tier_or_higher(self, required: str) -> bool:
        return TIER_PRIORITY.get(self.effective_tier, 0) >= TIER_PRIORITY.get(required, 0)

    @property
    def is_admin(self) -> bool:
        return self.effective_tier == SubscriptionTier.ADMIN

    @property
    def can_view_analytics(self) -> bool:
        return self.has_tier_or_higher(SubscriptionTier.USER)

    @property
    def can_create_championships(self) -> bool:
        return self.has_tier_or_higher(SubscriptionTier.PLUS)
