from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import User


@receiver(post_save, sender=User)
def create_user_role(sender, instance: User, created: bool, **kwargs) -> None:
    """Equivalente ao trigger handle_new_user_role do Supabase."""
    if created:
        from .models import UserRole

        UserRole.objects.get_or_create(user=instance)


@receiver(post_save, sender=User)
def create_user_profile(sender, instance: User, created: bool, **kwargs) -> None:
    """Equivalente ao trigger handle_new_user do Supabase."""
    if created:
        from apps.profiles.models import Profile  # import lazy para evitar circular

        Profile.objects.get_or_create(user=instance)
