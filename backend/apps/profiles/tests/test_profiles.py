import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import SubscriptionTier, User
from apps.championships.models import Championship, ChampionshipMember, MemberStatus


def auth_client(user: User) -> APIClient:
    client = APIClient()
    token = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")
    return client


@pytest.fixture
def user(db):
    return User.objects.create_user(email="piloto@test.com", password="senha123")


@pytest.fixture
def other_user(db):
    return User.objects.create_user(email="outro@test.com", password="senha123")


@pytest.fixture
def admin_user(db):
    u = User.objects.create_user(email="admin@test.com", password="senha123")
    u.role.tier = SubscriptionTier.ADMIN
    u.role.save()
    return u


@pytest.fixture
def plus_user(db):
    u = User.objects.create_user(email="plus@test.com", password="senha123")
    u.role.tier = SubscriptionTier.PLUS
    u.role.save()
    return u


# ─── List ─────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestProfileList:
    url = reverse("profile-list")

    def test_unauthenticated_returns_401(self):
        assert APIClient().get(self.url).status_code == 401

    def test_authenticated_can_list(self, user):
        res = auth_client(user).get(self.url)
        assert res.status_code == 200
        assert isinstance(res.json(), list)

    def test_list_does_not_include_weight(self, user):
        user.profile.weight = 70
        user.profile.save()
        res = auth_client(user).get(self.url)
        for item in res.json():
            assert "weight" not in item

    def test_list_returns_expected_fields(self, user):
        res = auth_client(user).get(self.url)
        assert res.status_code == 200
        item = res.json()[0]
        assert set(item.keys()) >= {"id", "username", "full_name", "avatar_url", "bio", "is_pro_member"}


# ─── Detail ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestProfileDetail:
    def _url(self, pk):
        return reverse("profile-detail", kwargs={"pk": pk})

    def test_unauthenticated_returns_401(self, user):
        assert APIClient().get(self._url(user.pk)).status_code == 401

    def test_returns_public_fields(self, user, other_user):
        res = auth_client(other_user).get(self._url(user.pk))
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == str(user.pk)

    def test_owner_sees_weight(self, user):
        user.profile.weight = 75
        user.profile.save()
        res = auth_client(user).get(self._url(user.pk))
        assert "weight" in res.json()
        assert res.json()["weight"] == "75.00"

    def test_stranger_does_not_see_weight(self, user, other_user):
        user.profile.weight = 75
        user.profile.save()
        res = auth_client(other_user).get(self._url(user.pk))
        assert "weight" not in res.json()

    def test_admin_sees_weight(self, user, admin_user):
        user.profile.weight = 80
        user.profile.save()
        res = auth_client(admin_user).get(self._url(user.pk))
        assert "weight" in res.json()

    def test_organizer_sees_member_weight(self, db, user, plus_user):
        """Organizador de campeonato do qual o piloto é membro ativo vê o peso."""
        championship = Championship.objects.create(
            name="Copa Teste",
            organizer=plus_user.profile,
        )
        ChampionshipMember.objects.create(
            championship=championship,
            profile=user.profile,
            status=MemberStatus.ACTIVE,
        )
        user.profile.weight = 68
        user.profile.save()
        res = auth_client(plus_user).get(self._url(user.pk))
        assert "weight" in res.json()

    def test_not_found_returns_404(self, user):
        import uuid
        res = auth_client(user).get(self._url(uuid.uuid4()))
        assert res.status_code == 404


# ─── Update ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestProfileUpdate:
    def _url(self, pk):
        return reverse("profile-detail", kwargs={"pk": pk})

    def test_unauthenticated_returns_401(self, user):
        assert APIClient().patch(self._url(user.pk), {}, format="json").status_code == 401

    def test_owner_can_update(self, user):
        res = auth_client(user).patch(
            self._url(user.pk),
            {"full_name": "Novo Nome", "bio": "Piloto de kart"},
            format="json",
        )
        assert res.status_code == 200
        user.profile.refresh_from_db()
        assert user.profile.full_name == "Novo Nome"
        assert user.profile.bio == "Piloto de kart"

    def test_non_owner_returns_403(self, user, other_user):
        res = auth_client(other_user).patch(
            self._url(user.pk), {"full_name": "Invasor"}, format="json"
        )
        assert res.status_code == 403

    def test_admin_can_update_any_profile(self, user, admin_user):
        res = auth_client(admin_user).patch(
            self._url(user.pk), {"bio": "Atualizado pelo admin"}, format="json"
        )
        assert res.status_code == 200
        user.profile.refresh_from_db()
        assert user.profile.bio == "Atualizado pelo admin"

    def test_update_preserves_unmodified_fields(self, user):
        user.profile.full_name = "Nome Original"
        user.profile.instagram = "@original"
        user.profile.save()
        auth_client(user).patch(self._url(user.pk), {"bio": "nova bio"}, format="json")
        user.profile.refresh_from_db()
        assert user.profile.full_name == "Nome Original"
        assert user.profile.instagram == "@original"


# ─── Weight visibility endpoint ────────────────────────────────────────────────

@pytest.mark.django_db
class TestCanViewWeight:
    def _url(self, pk):
        return reverse("profile-can-view-weight", kwargs={"pk": pk})

    def test_unauthenticated_returns_401(self, user):
        assert APIClient().get(self._url(user.pk)).status_code == 401

    def test_owner_can_view_weight(self, user):
        res = auth_client(user).get(self._url(user.pk))
        assert res.status_code == 200
        assert res.json()["can_view_weight"] is True

    def test_stranger_cannot_view_weight(self, user, other_user):
        res = auth_client(other_user).get(self._url(user.pk))
        assert res.json()["can_view_weight"] is False

    def test_admin_can_view_weight(self, user, admin_user):
        res = auth_client(admin_user).get(self._url(user.pk))
        assert res.json()["can_view_weight"] is True


# ─── Ensure ────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestProfileEnsure:
    url = reverse("profile-ensure")

    def test_unauthenticated_returns_401(self):
        assert APIClient().post(self.url).status_code == 401

    def test_returns_existing_profile(self, user):
        res = auth_client(user).post(self.url)
        assert res.status_code == 200
        assert res.json()["id"] == str(user.pk)

    def test_idempotent_on_repeated_calls(self, user):
        r1 = auth_client(user).post(self.url)
        r2 = auth_client(user).post(self.url)
        assert r1.json()["id"] == r2.json()["id"]
