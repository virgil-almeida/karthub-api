import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import SubscriptionTier, User
from apps.admin_panel.models import FeatureVisibility


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def auth_client(user: User) -> APIClient:
    c = APIClient()
    token = RefreshToken.for_user(user)
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")
    return c


def set_tier(user: User, tier: str) -> None:
    user.role.tier = tier
    user.role.save()


@pytest.fixture
def regular_user(make_user):
    return make_user()


@pytest.fixture
def moderator(make_user):
    u = make_user()
    set_tier(u, SubscriptionTier.MODERATOR)
    return u


@pytest.fixture
def admin_user(make_user):
    u = make_user()
    set_tier(u, SubscriptionTier.ADMIN)
    return u


@pytest.fixture
def feature(db):
    obj, _ = FeatureVisibility.objects.get_or_create(
        feature_key="profile_stats",
        defaults={"min_tier": SubscriptionTier.FREE, "label": "Estatísticas de Piloto"},
    )
    return obj


# ---------------------------------------------------------------------------
# FeatureVisibilityListView  — GET /api/v1/admin/feature-visibility/
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestFeatureVisibilityList:
    url = reverse("feature-visibility-list")

    def test_anonymous_can_list(self, feature):
        res = APIClient().get(self.url)
        assert res.status_code == 200
        assert any(f["feature_key"] == "profile_stats" for f in res.json())

    def test_authenticated_can_list(self, regular_user, feature):
        res = auth_client(regular_user).get(self.url)
        assert res.status_code == 200

    def test_returns_expected_fields(self, feature):
        res = APIClient().get(self.url)
        item = next(f for f in res.json() if f["feature_key"] == "profile_stats")
        assert "id" in item
        assert "feature_key" in item
        assert "min_tier" in item
        assert "label" in item


# ---------------------------------------------------------------------------
# FeatureVisibilityDetailView  — PATCH /api/v1/admin/feature-visibility/{id}/
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestFeatureVisibilityDetail:
    def url(self, pk):
        return reverse("feature-visibility-detail", kwargs={"pk": pk})

    def test_anonymous_returns_401(self, feature):
        res = APIClient().patch(self.url(feature.pk), {"min_tier": "user"}, format="json")
        assert res.status_code == 401

    def test_regular_user_returns_403(self, regular_user, feature):
        res = auth_client(regular_user).patch(self.url(feature.pk), {"min_tier": "user"}, format="json")
        assert res.status_code == 403

    def test_moderator_returns_403(self, moderator, feature):
        res = auth_client(moderator).patch(self.url(feature.pk), {"min_tier": "user"}, format="json")
        assert res.status_code == 403

    def test_admin_can_update_min_tier(self, admin_user, feature):
        res = auth_client(admin_user).patch(self.url(feature.pk), {"min_tier": "plus"}, format="json")
        assert res.status_code == 200
        feature.refresh_from_db()
        assert feature.min_tier == "plus"

    def test_feature_key_is_read_only(self, admin_user, feature):
        original_key = feature.feature_key
        res = auth_client(admin_user).patch(
            self.url(feature.pk), {"feature_key": "changed_key"}, format="json"
        )
        assert res.status_code == 200
        feature.refresh_from_db()
        assert feature.feature_key == original_key

    def test_not_found_returns_404(self, admin_user):
        import uuid
        res = auth_client(admin_user).patch(
            reverse("feature-visibility-detail", kwargs={"pk": uuid.uuid4()}),
            {"min_tier": "user"},
            format="json",
        )
        assert res.status_code == 404


# ---------------------------------------------------------------------------
# AdminUserListView  — GET /api/v1/admin/users/
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAdminUserList:
    url = reverse("admin-user-list")

    def test_anonymous_returns_401(self):
        res = APIClient().get(self.url)
        assert res.status_code == 401

    def test_regular_user_returns_403(self, regular_user):
        res = auth_client(regular_user).get(self.url)
        assert res.status_code == 403

    def test_moderator_can_list(self, moderator, regular_user):
        res = auth_client(moderator).get(self.url)
        assert res.status_code == 200
        ids = [u["id"] for u in res.json()]
        assert str(regular_user.pk) in ids
        assert str(moderator.pk) in ids

    def test_admin_can_list(self, admin_user):
        res = auth_client(admin_user).get(self.url)
        assert res.status_code == 200

    def test_response_includes_expected_fields(self, moderator, regular_user):
        res = auth_client(moderator).get(self.url)
        user_data = next(u for u in res.json() if u["id"] == str(regular_user.pk))
        for field in ("id", "email", "username", "full_name", "avatar_url", "created_at", "role"):
            assert field in user_data

    def test_role_includes_tier_and_expires_at(self, moderator, regular_user):
        res = auth_client(moderator).get(self.url)
        user_data = next(u for u in res.json() if u["id"] == str(regular_user.pk))
        role = user_data["role"]
        assert "tier" in role
        assert "expires_at" in role


# ---------------------------------------------------------------------------
# AdminUserTierView  — PATCH /DELETE /api/v1/admin/users/{id}/tier/
# ---------------------------------------------------------------------------

@pytest.mark.django_db
class TestAdminUserTierPatch:
    def url(self, pk):
        return reverse("admin-user-tier", kwargs={"user_pk": pk})

    def test_anonymous_returns_401(self, regular_user):
        res = APIClient().patch(self.url(regular_user.pk), {"tier": "plus"}, format="json")
        assert res.status_code == 401

    def test_regular_user_returns_403(self, regular_user, make_user):
        target = make_user()
        res = auth_client(regular_user).patch(self.url(target.pk), {"tier": "plus"}, format="json")
        assert res.status_code == 403

    def test_moderator_can_update_tier(self, moderator, regular_user):
        res = auth_client(moderator).patch(
            self.url(regular_user.pk), {"tier": "user"}, format="json"
        )
        assert res.status_code == 200
        regular_user.role.refresh_from_db()
        assert regular_user.role.tier == "user"

    def test_patch_sets_updated_by(self, moderator, regular_user):
        auth_client(moderator).patch(
            self.url(regular_user.pk), {"tier": "user"}, format="json"
        )
        regular_user.role.refresh_from_db()
        assert regular_user.role.updated_by_id == moderator.pk

    def test_invalid_tier_returns_400(self, moderator, regular_user):
        res = auth_client(moderator).patch(
            self.url(regular_user.pk), {"tier": "superadmin"}, format="json"
        )
        assert res.status_code == 400

    def test_not_found_returns_404(self, moderator):
        import uuid
        res = auth_client(moderator).patch(
            reverse("admin-user-tier", kwargs={"user_pk": uuid.uuid4()}),
            {"tier": "user"},
            format="json",
        )
        assert res.status_code == 404


@pytest.mark.django_db
class TestAdminUserTierDelete:
    def url(self, pk):
        return reverse("admin-user-tier", kwargs={"user_pk": pk})

    def test_anonymous_returns_401(self, regular_user):
        res = APIClient().delete(self.url(regular_user.pk))
        assert res.status_code == 401

    def test_regular_user_returns_403(self, regular_user, make_user):
        target = make_user()
        res = auth_client(regular_user).delete(self.url(target.pk))
        assert res.status_code == 403

    def test_moderator_can_reset_tier(self, moderator, make_user):
        target = make_user()
        set_tier(target, SubscriptionTier.PLUS)

        res = auth_client(moderator).delete(self.url(target.pk))
        assert res.status_code == 204
        target.role.refresh_from_db()
        assert target.role.tier == "free"
        assert target.role.expires_at is None
