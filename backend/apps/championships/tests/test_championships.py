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


@pytest.fixture
def public_championship(db, plus_user):
    return Championship.objects.create(
        name="Copa Pública", organizer=plus_user.profile, is_private=False
    )


@pytest.fixture
def private_championship(db, plus_user):
    return Championship.objects.create(
        name="Copa Privada", organizer=plus_user.profile, is_private=True
    )


# ─── List ─────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestChampionshipList:
    url = reverse("championship-list")

    def test_unauthenticated_returns_401(self):
        assert APIClient().get(self.url).status_code == 401

    def test_public_championship_visible_to_any_user(self, user, public_championship):
        res = auth_client(user).get(self.url)
        assert res.status_code == 200
        ids = [c["id"] for c in res.json()]
        assert str(public_championship.id) in ids

    def test_private_championship_hidden_from_strangers(self, user, private_championship):
        res = auth_client(user).get(self.url)
        ids = [c["id"] for c in res.json()]
        assert str(private_championship.id) not in ids

    def test_private_championship_visible_to_organizer(self, plus_user, private_championship):
        res = auth_client(plus_user).get(self.url)
        ids = [c["id"] for c in res.json()]
        assert str(private_championship.id) in ids

    def test_private_championship_visible_to_active_member(self, user, private_championship):
        ChampionshipMember.objects.create(
            championship=private_championship,
            profile=user.profile,
            status=MemberStatus.ACTIVE,
        )
        res = auth_client(user).get(self.url)
        ids = [c["id"] for c in res.json()]
        assert str(private_championship.id) in ids

    def test_private_championship_hidden_from_pending_member(self, user, private_championship):
        ChampionshipMember.objects.create(
            championship=private_championship,
            profile=user.profile,
            status=MemberStatus.PENDING,
        )
        res = auth_client(user).get(self.url)
        ids = [c["id"] for c in res.json()]
        assert str(private_championship.id) not in ids

    def test_admin_sees_all_championships(self, admin_user, private_championship):
        res = auth_client(admin_user).get(self.url)
        ids = [c["id"] for c in res.json()]
        assert str(private_championship.id) in ids


# ─── Create ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestChampionshipCreate:
    url = reverse("championship-list")

    def test_unauthenticated_returns_401(self):
        assert APIClient().post(self.url, {"name": "X"}, format="json").status_code == 401

    def test_free_tier_returns_403(self, user):
        res = auth_client(user).post(self.url, {"name": "Copa"}, format="json")
        assert res.status_code == 403

    def test_plus_tier_can_create(self, plus_user):
        res = auth_client(plus_user).post(
            self.url, {"name": "Copa Plus", "is_private": False}, format="json"
        )
        assert res.status_code == 201
        assert res.json()["name"] == "Copa Plus"

    def test_create_sets_organizer_to_current_user(self, plus_user):
        auth_client(plus_user).post(self.url, {"name": "Minha Copa"}, format="json")
        c = Championship.objects.get(name="Minha Copa")
        assert c.organizer_id == plus_user.profile.pk

    def test_create_private_championship(self, plus_user):
        res = auth_client(plus_user).post(
            self.url, {"name": "Copa Secreta", "is_private": True}, format="json"
        )
        assert res.status_code == 201
        assert res.json()["is_private"] is True

    def test_admin_can_create(self, admin_user):
        res = auth_client(admin_user).post(
            self.url, {"name": "Copa Admin"}, format="json"
        )
        assert res.status_code == 201


# ─── Detail ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestChampionshipDetail:
    def _url(self, pk):
        return reverse("championship-detail", kwargs={"pk": pk})

    def test_unauthenticated_returns_401(self, public_championship):
        assert APIClient().get(self._url(public_championship.pk)).status_code == 401

    def test_public_championship_returns_200(self, user, public_championship):
        res = auth_client(user).get(self._url(public_championship.pk))
        assert res.status_code == 200
        assert res.json()["id"] == str(public_championship.id)

    def test_private_championship_returns_404_for_strangers(self, user, private_championship):
        res = auth_client(user).get(self._url(private_championship.pk))
        assert res.status_code == 404

    def test_private_championship_returns_200_for_organizer(self, plus_user, private_championship):
        res = auth_client(plus_user).get(self._url(private_championship.pk))
        assert res.status_code == 200

    def test_response_includes_organizer(self, user, public_championship):
        res = auth_client(user).get(self._url(public_championship.pk))
        assert "organizer" in res.json()


# ─── Update ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestChampionshipUpdate:
    def _url(self, pk):
        return reverse("championship-detail", kwargs={"pk": pk})

    def test_organizer_can_update(self, plus_user, public_championship):
        res = auth_client(plus_user).patch(
            self._url(public_championship.pk),
            {"name": "Nome Atualizado"},
            format="json",
        )
        assert res.status_code == 200
        public_championship.refresh_from_db()
        assert public_championship.name == "Nome Atualizado"

    def test_non_organizer_returns_403(self, user, public_championship):
        res = auth_client(user).patch(
            self._url(public_championship.pk), {"name": "Invasor"}, format="json"
        )
        assert res.status_code == 403

    def test_admin_can_update_any(self, admin_user, public_championship):
        res = auth_client(admin_user).patch(
            self._url(public_championship.pk),
            {"rules_summary": "Novas regras"},
            format="json",
        )
        assert res.status_code == 200


# ─── Delete ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestChampionshipDelete:
    def _url(self, pk):
        return reverse("championship-detail", kwargs={"pk": pk})

    def test_organizer_can_delete(self, plus_user, public_championship):
        res = auth_client(plus_user).delete(self._url(public_championship.pk))
        assert res.status_code == 204
        assert not Championship.objects.filter(pk=public_championship.pk).exists()

    def test_non_organizer_returns_403(self, user, public_championship):
        res = auth_client(user).delete(self._url(public_championship.pk))
        assert res.status_code == 403

    def test_admin_can_delete_any(self, admin_user, public_championship):
        res = auth_client(admin_user).delete(self._url(public_championship.pk))
        assert res.status_code == 204


# ─── Mine ─────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestMyChampionships:
    url = reverse("championship-mine")

    def test_unauthenticated_returns_401(self):
        assert APIClient().get(self.url).status_code == 401

    def test_returns_championships_where_user_is_active_member(self, user, public_championship):
        ChampionshipMember.objects.create(
            championship=public_championship,
            profile=user.profile,
            status=MemberStatus.ACTIVE,
        )
        res = auth_client(user).get(self.url)
        ids = [c["id"] for c in res.json()]
        assert str(public_championship.id) in ids

    def test_excludes_pending_memberships(self, user, public_championship):
        ChampionshipMember.objects.create(
            championship=public_championship,
            profile=user.profile,
            status=MemberStatus.PENDING,
        )
        res = auth_client(user).get(self.url)
        ids = [c["id"] for c in res.json()]
        assert str(public_championship.id) not in ids


# ─── Members ──────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestChampionshipMembers:
    def _list_url(self, pk):
        return reverse("championship-member-list", kwargs={"championship_pk": pk})

    def _detail_url(self, champ_pk, member_pk):
        return reverse(
            "championship-member-detail",
            kwargs={"championship_pk": champ_pk, "member_pk": member_pk},
        )

    def test_list_members_unauthenticated_returns_401(self, public_championship):
        assert APIClient().get(self._list_url(public_championship.pk)).status_code == 401

    def test_list_members_of_public_championship(self, user, public_championship):
        ChampionshipMember.objects.create(
            championship=public_championship, profile=user.profile
        )
        res = auth_client(user).get(self._list_url(public_championship.pk))
        assert res.status_code == 200
        assert len(res.json()) == 1

    def test_list_members_of_private_championship_blocked_for_strangers(
        self, user, other_user, private_championship
    ):
        ChampionshipMember.objects.create(
            championship=private_championship, profile=user.profile
        )
        res = auth_client(other_user).get(self._list_url(private_championship.pk))
        assert res.status_code == 403

    def test_join_creates_pending_membership(self, user, public_championship):
        res = auth_client(user).post(self._list_url(public_championship.pk))
        assert res.status_code == 201
        assert res.json()["status"] == "pending"
        assert ChampionshipMember.objects.filter(
            championship=public_championship, profile=user.profile
        ).exists()

    def test_join_twice_is_idempotent(self, user, public_championship):
        auth_client(user).post(self._list_url(public_championship.pk))
        res = auth_client(user).post(self._list_url(public_championship.pk))
        assert res.status_code == 200
        assert ChampionshipMember.objects.filter(
            championship=public_championship, profile=user.profile
        ).count() == 1

    def test_organizer_can_approve_member(self, user, plus_user, public_championship):
        member = ChampionshipMember.objects.create(
            championship=public_championship,
            profile=user.profile,
            status=MemberStatus.PENDING,
        )
        res = auth_client(plus_user).patch(
            self._detail_url(public_championship.pk, member.pk),
            {"status": "active"},
            format="json",
        )
        assert res.status_code == 200
        member.refresh_from_db()
        assert member.status == MemberStatus.ACTIVE

    def test_non_organizer_cannot_update_member(self, user, other_user, public_championship):
        member = ChampionshipMember.objects.create(
            championship=public_championship, profile=user.profile
        )
        res = auth_client(other_user).patch(
            self._detail_url(public_championship.pk, member.pk),
            {"status": "active"},
            format="json",
        )
        assert res.status_code == 403

    def test_organizer_can_remove_member(self, user, plus_user, public_championship):
        member = ChampionshipMember.objects.create(
            championship=public_championship, profile=user.profile
        )
        res = auth_client(plus_user).delete(
            self._detail_url(public_championship.pk, member.pk)
        )
        assert res.status_code == 204
        assert not ChampionshipMember.objects.filter(pk=member.pk).exists()
