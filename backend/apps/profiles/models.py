from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Profile(models.Model):
    # id é o mesmo UUID do User (OneToOne com primary_key)
    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        primary_key=True,
        related_name="profile",
        db_column="id",
    )
    username = models.CharField(max_length=50, unique=True, null=True, blank=True)
    full_name = models.CharField(max_length=255, null=True, blank=True)
    avatar_url = models.CharField(max_length=500, null=True, blank=True)
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)
    weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(500)],
        help_text="Peso em kg",
    )
    bio = models.CharField(max_length=5000, null=True, blank=True)
    is_pro_member = models.BooleanField(default=False)
    instagram = models.CharField(max_length=255, null=True, blank=True)
    youtube = models.CharField(max_length=255, null=True, blank=True)
    tiktok = models.CharField(max_length=255, null=True, blank=True)
    website = models.CharField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "profiles"

    def __str__(self) -> str:
        return self.username or str(self.user_id)

    @property
    def id(self):
        return self.user_id
