import uuid

from django.core.validators import MinValueValidator
from django.db import models


class Track(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    location = models.CharField(max_length=500)
    length_meters = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1)],
    )
    map_image_url = models.CharField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "tracks"
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.location})"
