"""Testes para BadgeDefinition e DriverBadge."""
import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import SubscriptionTier, User
from apps.badges.models import BadgeDefinition, DriverBadge
from apps.championships.models import Championship


def auth_client(user: User) -> APIClient:
    c = APIClient()
    token = RefreshToken.for_user(user)
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")
    return c


# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def moderator(db):
    u = User.objects.create_user(email="mod@test.com", password="senha123")
    u.role.tier = SubscriptionTier.MODERATOR
    u.role.save()
    return u


@pytest.fixture
def regular_user(db):
    return User.objects.create_user(email="user@test.com", password="senha123")


@pytest.fixture
def admin_user(db):
    u = User.objects.create_user(email="admin@test.com", password="senha123")
    u.role.tier = SubscriptionTier.ADMIN
    u.role.save()
    return u


@pytest.fixture
def badge_def(db, moderator):
    return BadgeDefinition.objects.create(
        name="Pole Position",
        description="Largou em primeiro",
        icon_name="Trophy",
        color="#FFD700",
        created_by=moderator.profile,
    )


@pytest.fixture
def driver_user(db):
    return User.objects.create_user(email="driver@test.com", password="senha123")


@pytest.fixture
def driver_badge(db, driver_user, badge_def, moderator):
    return DriverBadge.objects.create(
        profile=driver_user.profile,
        badge_definition=badge_def,
        badge_type="achievement",
        badge_name=badge_def.name,
        awarded_by=moderator.profile,
    )


# ─── BadgeDefinition: list ────────────────────────────────────────────────────

@pytest.mark.django_db
class TestBadgeDefinitionList:
    url = reverse("badge-definition-list")

    def test_unauthenticated_returns_401(self):
        assert APIClient().get(self.url).status_code == 401

    def test_authenticated_can_list(self, regular_user, badge_def):
        res = auth_client(regular_user).get(self.url)
        assert res.status_code == 200
        assert any(b["id"] == str(badge_def.id) for b in res.json())

    def test_response_fields(self, regular_user, badge_def):
        item = auth_client(regular_user).get(self.url).json()[0]
        assert set(item.keys()) >= {"id", "name", "description", "icon_name", "color", "created_at"}

    def test_empty_list_returns_200(self, regular_user):
        res = auth_client(regular_user).get(self.url)
        assert res.status_code == 200
        assert isinstance(res.json(), list)


# ─── BadgeDefinition: create ──────────────────────────────────────────────────

@pytest.mark.django_db
class TestBadgeDefinitionCreate:
    url = reverse("badge-definition-list")

    def test_unauthenticated_returns_401(self):
        assert APIClient().post(self.url, {}, format="json").status_code == 401

    def test_moderator_can_create(self, moderator):
        res = auth_client(moderator).post(
            self.url,
            {"name": "Volta Rápida", "icon_name": "Zap", "color": "#00FF00"},
            format="json",
        )
        assert res.status_code == 201
        assert res.json()["name"] == "Volta Rápida"

    def test_admin_can_create(self, admin_user):
        res = auth_client(admin_user).post(
            self.url,
            {"name": "Hat-Trick", "icon_name": "Star"},
            format="json",
        )
        assert res.status_code == 201

    def test_regular_user_returns_403(self, regular_user):
        res = auth_client(regular_user).post(
            self.url,
            {"name": "Tentativa", "icon_name": "Award"},
            format="json",
        )
        assert res.status_code == 403

    def test_missing_name_returns_400(self, moderator):
        res = auth_client(moderator).post(self.url, {"icon_name": "Award"}, format="json")
        assert res.status_code == 400

    def test_created_by_set_automatically(self, moderator):
        res = auth_client(moderator).post(
            self.url, {"name": "Auto Badge", "icon_name": "Award"}, format="json"
        )
        assert res.status_code == 201
        assert res.json()["created_by_id"] == str(moderator.profile.pk)


# ─── BadgeDefinition: update ──────────────────────────────────────────────────

@pytest.mark.django_db
class TestBadgeDefinitionUpdate:
    def _url(self, pk):
        return reverse("badge-definition-detail", kwargs={"pk": pk})

    def test_unauthenticated_returns_401(self, badge_def):
        assert APIClient().patch(self._url(badge_def.pk), {}, format="json").status_code == 401

    def test_moderator_can_update(self, moderator, badge_def):
        res = auth_client(moderator).patch(
            self._url(badge_def.pk), {"name": "Novo Nome", "color": "#FF0000"}, format="json"
        )
        assert res.status_code == 200
        badge_def.refresh_from_db()
        assert badge_def.name == "Novo Nome"
        assert badge_def.color == "#FF0000"

    def test_regular_user_returns_403(self, regular_user, badge_def):
        res = auth_client(regular_user).patch(
            self._url(badge_def.pk), {"name": "X"}, format="json"
        )
        assert res.status_code == 403

    def test_not_found_returns_404(self, moderator):
        import uuid
        assert auth_client(moderator).patch(
            self._url(uuid.uuid4()), {"name": "X"}, format="json"
        ).status_code == 404


# ─── BadgeDefinition: delete ──────────────────────────────────────────────────

@pytest.mark.django_db
class TestBadgeDefinitionDelete:
    def _url(self, pk):
        return reverse("badge-definition-detail", kwargs={"pk": pk})

    def test_unauthenticated_returns_401(self, badge_def):
        assert APIClient().delete(self._url(badge_def.pk)).status_code == 401

    def test_moderator_can_delete(self, moderator, badge_def):
        res = auth_client(moderator).delete(self._url(badge_def.pk))
        assert res.status_code == 204
        assert not BadgeDefinition.objects.filter(pk=badge_def.pk).exists()

    def test_regular_user_returns_403(self, regular_user, badge_def):
        assert auth_client(regular_user).delete(self._url(badge_def.pk)).status_code == 403

    def test_not_found_returns_404(self, moderator):
        import uuid
        assert auth_client(moderator).delete(self._url(uuid.uuid4())).status_code == 404


# ─── DriverBadge: list ────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestDriverBadgeList:
    url = reverse("driver-badge-list")

    def test_unauthenticated_returns_401(self):
        assert APIClient().get(self.url).status_code == 401

    def test_moderator_can_list(self, moderator, driver_badge):
        res = auth_client(moderator).get(self.url)
        assert res.status_code == 200
        assert any(b["id"] == str(driver_badge.id) for b in res.json())

    def test_regular_user_returns_403(self, regular_user):
        assert auth_client(regular_user).get(self.url).status_code == 403

    def test_response_fields(self, moderator, driver_badge):
        item = auth_client(moderator).get(self.url).json()[0]
        assert set(item.keys()) >= {
            "id", "profile_id", "badge_definition_id",
            "badge_type", "badge_name", "earned_at",
        }


# ─── DriverBadge: create ──────────────────────────────────────────────────────

@pytest.mark.django_db
class TestDriverBadgeCreate:
    url = reverse("driver-badge-list")

    def test_unauthenticated_returns_401(self):
        assert APIClient().post(self.url, {}, format="json").status_code == 401

    def test_moderator_can_award_badge(self, moderator, driver_user, badge_def):
        res = auth_client(moderator).post(
            self.url,
            {
                "profile_id": str(driver_user.profile.pk),
                "badge_definition_id": str(badge_def.pk),
                "badge_type": "achievement",
                "badge_name": badge_def.name,
            },
            format="json",
        )
        assert res.status_code == 201
        assert res.json()["profile_id"] == str(driver_user.profile.pk)
        assert res.json()["badge_name"] == badge_def.name

    def test_awarded_by_set_automatically(self, moderator, driver_user, badge_def):
        res = auth_client(moderator).post(
            self.url,
            {
                "profile_id": str(driver_user.profile.pk),
                "badge_type": "manual",
                "badge_name": "Especial",
            },
            format="json",
        )
        assert res.status_code == 201
        assert res.json()["awarded_by_id"] == str(moderator.profile.pk)

    def test_regular_user_returns_403(self, regular_user, driver_user):
        res = auth_client(regular_user).post(
            self.url,
            {"profile_id": str(driver_user.profile.pk), "badge_type": "x", "badge_name": "x"},
            format="json",
        )
        assert res.status_code == 403

    def test_missing_required_fields_returns_400(self, moderator):
        res = auth_client(moderator).post(self.url, {"badge_type": "x"}, format="json")
        assert res.status_code == 400


# ─── DriverBadge: delete ──────────────────────────────────────────────────────

@pytest.mark.django_db
class TestDriverBadgeDelete:
    def _url(self, pk):
        return reverse("driver-badge-delete", kwargs={"pk": pk})

    def test_unauthenticated_returns_401(self, driver_badge):
        assert APIClient().delete(self._url(driver_badge.pk)).status_code == 401

    def test_moderator_can_delete(self, moderator, driver_badge):
        res = auth_client(moderator).delete(self._url(driver_badge.pk))
        assert res.status_code == 204
        assert not DriverBadge.objects.filter(pk=driver_badge.pk).exists()

    def test_regular_user_returns_403(self, regular_user, driver_badge):
        assert auth_client(regular_user).delete(self._url(driver_badge.pk)).status_code == 403

    def test_not_found_returns_404(self, moderator):
        import uuid
        assert auth_client(moderator).delete(self._url(uuid.uuid4())).status_code == 404


# ─── Profile badges ───────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestProfileBadges:
    def _url(self, profile_pk):
        return reverse("profile-badges", kwargs={"profile_pk": profile_pk})

    def test_unauthenticated_returns_401(self, driver_user):
        assert APIClient().get(self._url(driver_user.profile.pk)).status_code == 401

    def test_authenticated_can_list_profile_badges(self, regular_user, driver_user, driver_badge):
        res = auth_client(regular_user).get(self._url(driver_user.profile.pk))
        assert res.status_code == 200
        assert any(b["id"] == str(driver_badge.id) for b in res.json())

    def test_returns_only_that_profiles_badges(self, regular_user, driver_user, moderator, badge_def):
        other_user = User.objects.create_user(email="other2@test.com", password="x")
        DriverBadge.objects.create(
            profile=other_user.profile, badge_type="x", badge_name="Other Badge"
        )
        DriverBadge.objects.create(
            profile=driver_user.profile, badge_type="y", badge_name="Driver Badge"
        )
        res = auth_client(regular_user).get(self._url(driver_user.profile.pk))
        assert res.status_code == 200
        assert all(b["profile_id"] == str(driver_user.profile.pk) for b in res.json())

    def test_empty_profile_returns_empty_list(self, regular_user, driver_user):
        res = auth_client(regular_user).get(self._url(driver_user.profile.pk))
        assert res.status_code == 200
        assert res.json() == []

    def test_returns_badges_ordered_by_earned_at_desc(self, regular_user, driver_user, badge_def, moderator):
        b1 = DriverBadge.objects.create(
            profile=driver_user.profile, badge_type="a", badge_name="B1"
        )
        b2 = DriverBadge.objects.create(
            profile=driver_user.profile, badge_type="b", badge_name="B2"
        )
        res = auth_client(regular_user).get(self._url(driver_user.profile.pk))
        ids = [b["id"] for b in res.json()]
        assert ids.index(str(b2.id)) < ids.index(str(b1.id))
