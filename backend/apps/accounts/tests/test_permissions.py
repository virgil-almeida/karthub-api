import pytest
from rest_framework.test import APIRequestFactory

from apps.accounts.models import SubscriptionTier, User
from apps.accounts.permissions import (
    IsAdminTier,
    IsModeratorOrHigher,
    IsPlusTierOrHigher,
    IsUserTierOrHigher,
)


def make_request_with_user(tier: str):
    factory = APIRequestFactory()
    request = factory.get("/")
    user = User(email=f"{tier}@test.com")
    user.pk = None  # não salvo no banco
    # Simula role sem tocar no banco
    from apps.accounts.models import UserRole

    role = UserRole(tier=tier)
    user.role = role  # type: ignore[attr-defined]
    request.user = user
    return request


@pytest.mark.django_db
class TestPermissions:
    @pytest.fixture
    def user_free(self, db):
        return User.objects.create_user(email="free@test.com", password="senha123")

    @pytest.fixture
    def user_user(self, db):
        u = User.objects.create_user(email="user@test.com", password="senha123")
        u.role.tier = SubscriptionTier.USER
        u.role.save()
        return u

    @pytest.fixture
    def user_plus(self, db):
        u = User.objects.create_user(email="plus@test.com", password="senha123")
        u.role.tier = SubscriptionTier.PLUS
        u.role.save()
        return u

    @pytest.fixture
    def user_moderator(self, db):
        u = User.objects.create_user(email="mod@test.com", password="senha123")
        u.role.tier = SubscriptionTier.MODERATOR
        u.role.save()
        return u

    @pytest.fixture
    def user_admin(self, db):
        u = User.objects.create_user(email="admin@test.com", password="senha123")
        u.role.tier = SubscriptionTier.ADMIN
        u.role.save()
        return u

    def _check(self, permission_class, user):
        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = user
        perm = permission_class()
        return perm.has_permission(request, None)

    def test_user_tier_or_higher(self, user_free, user_user, user_plus, user_admin):
        perm = IsUserTierOrHigher
        assert not self._check(perm, user_free)
        assert self._check(perm, user_user)
        assert self._check(perm, user_plus)
        assert self._check(perm, user_admin)

    def test_plus_tier_or_higher(self, user_free, user_user, user_plus, user_moderator, user_admin):
        perm = IsPlusTierOrHigher
        assert not self._check(perm, user_free)
        assert not self._check(perm, user_user)
        assert self._check(perm, user_plus)
        assert self._check(perm, user_moderator)
        assert self._check(perm, user_admin)

    def test_moderator_or_higher(self, user_plus, user_moderator, user_admin):
        perm = IsModeratorOrHigher
        assert not self._check(perm, user_plus)
        assert self._check(perm, user_moderator)
        assert self._check(perm, user_admin)

    def test_admin_tier(self, user_moderator, user_admin):
        perm = IsAdminTier
        assert not self._check(perm, user_moderator)
        assert self._check(perm, user_admin)
