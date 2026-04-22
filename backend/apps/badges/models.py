import uuid

from django.db import models


class BadgeDefinition(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    description = models.TextField(null=True, blank=True)
    icon_name = models.CharField(max_length=100, default="Award")
    color = models.CharField(max_length=50, default="#FFD700")
    is_automatic = models.BooleanField(default=False, null=True)
    auto_condition = models.CharField(max_length=500, null=True, blank=True)
    championship = models.ForeignKey(
        "championships.Championship",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="badge_definitions",
        db_column="championship_id",
    )
    created_by = models.ForeignKey(
        "profiles.Profile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
        db_column="created_by",
    )
    show_preview = models.BooleanField(default=True)
    custom_image_url = models.CharField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "badge_definitions"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class DriverBadge(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    profile = models.ForeignKey(
        "profiles.Profile",
        on_delete=models.CASCADE,
        related_name="badges",
        db_column="profile_id",
    )
    badge_definition = models.ForeignKey(
        BadgeDefinition,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_badges",
        db_column="badge_definition_id",
    )
    badge_type = models.CharField(max_length=100)
    badge_name = models.CharField(max_length=200)
    championship = models.ForeignKey(
        "championships.Championship",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
        db_column="championship_id",
    )
    awarded_by = models.ForeignKey(
        "profiles.Profile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="+",
        db_column="awarded_by",
    )
    notes = models.TextField(null=True, blank=True)
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "driver_badges"
        ordering = ["-earned_at"]

    def __str__(self) -> str:
        return f"{self.badge_name} → {self.profile}"
