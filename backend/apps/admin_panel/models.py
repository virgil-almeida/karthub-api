import uuid

from django.db import models

from apps.accounts.models import SubscriptionTier


class FeatureVisibility(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    feature_key = models.CharField(max_length=100, unique=True)
    min_tier = models.CharField(
        max_length=20,
        choices=SubscriptionTier.choices,
        default=SubscriptionTier.FREE,
    )
    label = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "feature_visibility"
        ordering = ["label"]

    def __str__(self) -> str:
        return f"{self.label} (min: {self.min_tier})"
