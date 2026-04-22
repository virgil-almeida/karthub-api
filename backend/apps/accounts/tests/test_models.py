import pytest
from django.utils import timezone

from apps.accounts.models import SubscriptionTier, User


@pytest.mark.django_db
class TestUserModel:
    def test_create_user_with_email(self):
        user = User.objects.create_user(email="piloto@test.com", password="senha123")
        assert user.email == "piloto@test.com"
        assert user.check_password("senha123")

    def test_user_str_returns_email(self):
        user = User.objects.create_user(email="piloto@test.com", password="senha123")
        assert str(user) == "piloto@test.com"

    def test_create_user_auto_creates_role(self):
        user = User.objects.create_user(email="piloto@test.com", password="senha123")
        assert hasattr(user, "role")
        assert user.role.tier == SubscriptionTier.FREE

    def test_create_user_auto_creates_profile(self):
        user = User.objects.create_user(email="piloto@test.com", password="senha123")
        assert hasattr(user, "profile")

    def test_create_superuser(self):
        user = User.objects.create_superuser(email="admin@test.com", password="senha123")
        assert user.is_staff
        assert user.is_superuser


@pytest.mark.django_db
class TestUserRole:
    def test_effective_tier_returns_free_when_expired(self):
        user = User.objects.create_user(email="piloto@test.com", password="senha123")
        role = user.role
        role.tier = SubscriptionTier.PLUS
        role.expires_at = timezone.now() - timezone.timedelta(days=1)
        role.save()
        assert role.effective_tier == SubscriptionTier.FREE

    def test_effective_tier_returns_tier_when_not_expired(self):
        user = User.objects.create_user(email="piloto@test.com", password="senha123")
        role = user.role
        role.tier = SubscriptionTier.PLUS
        role.expires_at = timezone.now() + timezone.timedelta(days=30)
        role.save()
        assert role.effective_tier == SubscriptionTier.PLUS

    def test_effective_tier_returns_tier_when_no_expiry(self):
        user = User.objects.create_user(email="piloto@test.com", password="senha123")
        role = user.role
        role.tier = SubscriptionTier.USER
        role.expires_at = None
        role.save()
        assert role.effective_tier == SubscriptionTier.USER

    def test_has_tier_or_higher(self):
        user = User.objects.create_user(email="piloto@test.com", password="senha123")
        role = user.role
        role.tier = SubscriptionTier.PLUS
        role.save()
        assert role.has_tier_or_higher(SubscriptionTier.FREE)
        assert role.has_tier_or_higher(SubscriptionTier.USER)
        assert role.has_tier_or_higher(SubscriptionTier.PLUS)
        assert not role.has_tier_or_higher(SubscriptionTier.MODERATOR)
        assert not role.has_tier_or_higher(SubscriptionTier.ADMIN)

    def test_is_admin_property(self):
        user = User.objects.create_user(email="piloto@test.com", password="senha123")
        role = user.role
        assert not role.is_admin
        role.tier = SubscriptionTier.ADMIN
        role.save()
        assert role.is_admin

    def test_can_view_analytics_requires_user_tier(self):
        user = User.objects.create_user(email="piloto@test.com", password="senha123")
        role = user.role
        assert not role.can_view_analytics  # free
        role.tier = SubscriptionTier.USER
        role.save()
        assert role.can_view_analytics

    def test_can_create_championships_requires_plus(self):
        user = User.objects.create_user(email="piloto@test.com", password="senha123")
        role = user.role
        role.tier = SubscriptionTier.USER
        role.save()
        assert not role.can_create_championships
        role.tier = SubscriptionTier.PLUS
        role.save()
        assert role.can_create_championships
