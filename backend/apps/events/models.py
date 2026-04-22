import uuid

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class EventStatus(models.TextChoices):
    SCHEDULED = "scheduled", "Agendada"
    IN_PROGRESS = "in_progress", "Em Andamento"
    COMPLETED = "completed", "Concluída"
    CANCELLED = "cancelled", "Cancelada"


class Event(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    championship = models.ForeignKey(
        "championships.Championship",
        on_delete=models.CASCADE,
        related_name="events",
        db_column="championship_id",
    )
    track = models.ForeignKey(
        "tracks.Track",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="events",
        db_column="track_id",
    )
    name = models.CharField(max_length=200)
    date = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=EventStatus.choices,
        default=EventStatus.SCHEDULED,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "events"
        ordering = ["-date"]

    def __str__(self) -> str:
        return f"{self.name} ({self.date})"


class WeatherCondition(models.TextChoices):
    DRY = "dry", "Seco"
    WET = "wet", "Molhado"
    MIXED = "mixed", "Misto"


class Heat(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    event = models.ForeignKey(
        Event,
        on_delete=models.CASCADE,
        related_name="heats",
        db_column="event_id",
    )
    name = models.CharField(max_length=200)
    weather_condition = models.CharField(
        max_length=10,
        choices=WeatherCondition.choices,
        default=WeatherCondition.DRY,
        null=True,
        blank=True,
    )
    start_time = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "heats"
        ordering = ["start_time"]

    def __str__(self) -> str:
        return f"{self.name} @ {self.event}"


class HeatResult(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    heat = models.ForeignKey(
        Heat,
        on_delete=models.CASCADE,
        related_name="results",
        db_column="heat_id",
    )
    driver = models.ForeignKey(
        "profiles.Profile",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="heat_results",
        db_column="driver_id",
    )
    driver_name_text = models.CharField(max_length=255, null=True, blank=True)
    position = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    kart_number = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(999)],
    )
    best_lap_time = models.CharField(max_length=20, null=True, blank=True)
    total_time = models.CharField(max_length=20, null=True, blank=True)
    gap_to_leader = models.CharField(max_length=20, null=True, blank=True)
    gap_to_previous = models.CharField(max_length=20, null=True, blank=True)
    average_speed = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    total_laps = models.PositiveIntegerField(null=True, blank=True)
    payment_status = models.BooleanField(default=False, null=True)
    points = models.PositiveIntegerField(default=0, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "heat_results"
        ordering = ["position"]

    def __str__(self) -> str:
        name = self.driver or self.driver_name_text or "?"
        return f"P{self.position} — {name}"


class LapTelemetry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    heat_result = models.ForeignKey(
        HeatResult,
        on_delete=models.CASCADE,
        related_name="telemetry",
        db_column="heat_result_id",
    )
    lap_number = models.PositiveIntegerField()
    lap_time = models.CharField(max_length=20)
    sector1 = models.CharField(max_length=20, null=True, blank=True)
    sector2 = models.CharField(max_length=20, null=True, blank=True)
    sector3 = models.CharField(max_length=20, null=True, blank=True)
    kart_number = models.PositiveSmallIntegerField(null=True, blank=True)
    gap_to_best = models.CharField(max_length=20, null=True, blank=True)
    gap_to_leader = models.CharField(max_length=20, null=True, blank=True)
    total_time = models.CharField(max_length=20, null=True, blank=True)
    average_speed = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "lap_telemetry"
        ordering = ["lap_number"]

    def __str__(self) -> str:
        return f"Volta {self.lap_number} — {self.lap_time}"
