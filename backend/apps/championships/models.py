import uuid

from django.db import models


class Championship(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    organizer = models.ForeignKey(
        "profiles.Profile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="organized_championships",
        db_column="organizer_id",
    )
    rules_summary = models.CharField(max_length=10000, null=True, blank=True)
    is_private = models.BooleanField(default=False)
    logo_url = models.CharField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "championships"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.name


class MemberStatus(models.TextChoices):
    ACTIVE = "active", "Ativo"
    PENDING = "pending", "Pendente"
    BANNED = "banned", "Banido"


class MemberRole(models.TextChoices):
    DRIVER = "driver", "Piloto"
    ADMIN = "admin", "Admin"
    ORGANIZER = "organizer", "Organizador"


class ChampionshipMember(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    championship = models.ForeignKey(
        Championship,
        on_delete=models.CASCADE,
        related_name="members",
        db_column="championship_id",
    )
    profile = models.ForeignKey(
        "profiles.Profile",
        on_delete=models.CASCADE,
        related_name="championship_memberships",
        db_column="profile_id",
    )
    status = models.CharField(
        max_length=10,
        choices=MemberStatus.choices,
        default=MemberStatus.PENDING,
    )
    role = models.CharField(
        max_length=10,
        choices=MemberRole.choices,
        default=MemberRole.DRIVER,
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "championship_members"
        unique_together = [("championship", "profile")]

    def __str__(self) -> str:
        return f"{self.profile} @ {self.championship} ({self.status})"
