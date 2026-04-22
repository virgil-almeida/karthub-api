import uuid

from django.db import models


class RaceType(models.TextChoices):
    TRAINING = "training", "Treino"
    STANDALONE = "standalone", "Avulsa"


class StandaloneRace(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="standalone_races",
        db_column="user_id",
    )
    race_type = models.CharField(
        max_length=15,
        choices=RaceType.choices,
        default=RaceType.STANDALONE,
    )
    track_name = models.CharField(max_length=200, null=True, blank=True)
    date = models.DateField()
    position = models.PositiveIntegerField(null=True, blank=True)
    kart_number = models.PositiveSmallIntegerField(null=True, blank=True)
    total_laps = models.PositiveIntegerField(null=True, blank=True)
    best_lap_time = models.CharField(max_length=20, null=True, blank=True)
    total_time = models.CharField(max_length=20, null=True, blank=True)
    average_speed = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    gap_to_leader = models.CharField(max_length=20, null=True, blank=True)
    points = models.PositiveIntegerField(default=0)
    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "standalone_races"
        ordering = ["-date"]

    def __str__(self) -> str:
        return f"{self.race_type} — {self.track_name or 'Sem pista'} ({self.date})"


class StandaloneRaceTelemetry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    standalone_race = models.ForeignKey(
        StandaloneRace,
        on_delete=models.CASCADE,
        related_name="telemetry",
        db_column="standalone_race_id",
    )
    lap_number = models.PositiveIntegerField()
    lap_time = models.CharField(max_length=20)
    kart_number = models.PositiveSmallIntegerField(null=True, blank=True)
    gap_to_best = models.CharField(max_length=20, null=True, blank=True)
    gap_to_leader = models.CharField(max_length=20, null=True, blank=True)
    total_time = models.CharField(max_length=20, null=True, blank=True)
    average_speed = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    sector1 = models.CharField(max_length=20, null=True, blank=True)
    sector2 = models.CharField(max_length=20, null=True, blank=True)
    sector3 = models.CharField(max_length=20, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "standalone_race_telemetry"
        ordering = ["lap_number"]

    def __str__(self) -> str:
        return f"Volta {self.lap_number} — {self.lap_time}"
