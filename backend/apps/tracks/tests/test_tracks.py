import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import SubscriptionTier, User
from apps.tracks.models import Track


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(email="piloto@test.com", password="senha123")


@pytest.fixture
def admin_user(db):
    u = User.objects.create_user(email="admin@test.com", password="senha123")
    u.role.tier = SubscriptionTier.ADMIN
    u.role.save()
    return u


@pytest.fixture
def track(db):
    return Track.objects.create(
        name="Kartódromo Internacional de Londrina",
        location="Londrina, PR",
        length_meters=1200,
    )


def auth_client(user):
    client = APIClient()
    from rest_framework_simplejwt.tokens import RefreshToken

    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {str(refresh.access_token)}")
    return client


LIST_URL = "track-list"
DETAIL_URL = "track-detail"


@pytest.mark.django_db
class TestTrackList:
    def test_unauthenticated_returns_401(self, api_client):
        url = reverse(LIST_URL)
        assert api_client.get(url).status_code == 401

    def test_authenticated_user_can_list(self, user, track):
        client = auth_client(user)
        res = client.get(reverse(LIST_URL))
        assert res.status_code == 200
        results = res.json()["results"]
        assert any(t["id"] == str(track.id) for t in results)

    def test_list_returns_expected_fields(self, user, track):
        client = auth_client(user)
        res = client.get(reverse(LIST_URL))
        item = res.json()["results"][0]
        assert set(item.keys()) >= {"id", "name", "location", "length_meters", "map_image_url", "created_at"}

    def test_list_ordered_by_name(self, user, db):
        Track.objects.create(name="Zebra Track", location="SP")
        Track.objects.create(name="Alpha Track", location="MG")
        client = auth_client(user)
        results = client.get(reverse(LIST_URL)).json()["results"]
        names = [t["name"] for t in results]
        assert names == sorted(names)


@pytest.mark.django_db
class TestTrackCreate:
    def test_unauthenticated_returns_401(self, api_client):
        url = reverse(LIST_URL)
        assert api_client.post(url, {"name": "Nova", "location": "SP"}, format="json").status_code == 401

    def test_non_admin_returns_403(self, user):
        client = auth_client(user)
        res = client.post(reverse(LIST_URL), {"name": "Nova", "location": "SP"}, format="json")
        assert res.status_code == 403

    def test_admin_can_create(self, admin_user):
        client = auth_client(admin_user)
        payload = {"name": "Kartódromo ABC", "location": "Curitiba, PR", "length_meters": 900}
        res = client.post(reverse(LIST_URL), payload, format="json")
        assert res.status_code == 201
        data = res.json()
        assert data["name"] == "Kartódromo ABC"
        assert data["location"] == "Curitiba, PR"
        assert data["length_meters"] == 900
        assert Track.objects.filter(name="Kartódromo ABC").exists()

    def test_create_without_optional_fields(self, admin_user):
        client = auth_client(admin_user)
        res = client.post(reverse(LIST_URL), {"name": "Pista Simples", "location": "RJ"}, format="json")
        assert res.status_code == 201
        data = res.json()
        assert data["length_meters"] is None
        assert data["map_image_url"] is None

    def test_create_missing_required_fields_returns_400(self, admin_user):
        client = auth_client(admin_user)
        res = client.post(reverse(LIST_URL), {"name": "Sem Local"}, format="json")
        assert res.status_code == 400


@pytest.mark.django_db
class TestTrackDetail:
    def test_unauthenticated_returns_401(self, api_client, track):
        url = reverse(DETAIL_URL, kwargs={"pk": track.pk})
        assert api_client.get(url).status_code == 401

    def test_authenticated_user_can_get(self, user, track):
        client = auth_client(user)
        url = reverse(DETAIL_URL, kwargs={"pk": track.pk})
        res = client.get(url)
        assert res.status_code == 200
        assert res.json()["id"] == str(track.id)
        assert res.json()["name"] == track.name

    def test_not_found_returns_404(self, user):
        import uuid

        client = auth_client(user)
        url = reverse(DETAIL_URL, kwargs={"pk": uuid.uuid4()})
        assert client.get(url).status_code == 404


@pytest.mark.django_db
class TestTrackUpdate:
    def test_unauthenticated_returns_401(self, api_client, track):
        url = reverse(DETAIL_URL, kwargs={"pk": track.pk})
        assert api_client.patch(url, {"name": "Novo Nome"}, format="json").status_code == 401

    def test_non_admin_returns_403(self, user, track):
        client = auth_client(user)
        url = reverse(DETAIL_URL, kwargs={"pk": track.pk})
        assert client.patch(url, {"name": "Novo Nome"}, format="json").status_code == 403

    def test_admin_can_update(self, admin_user, track):
        client = auth_client(admin_user)
        url = reverse(DETAIL_URL, kwargs={"pk": track.pk})
        res = client.patch(url, {"name": "Nome Atualizado", "length_meters": 1500}, format="json")
        assert res.status_code == 200
        track.refresh_from_db()
        assert track.name == "Nome Atualizado"
        assert track.length_meters == 1500

    def test_admin_partial_update_preserves_other_fields(self, admin_user, track):
        original_location = track.location
        client = auth_client(admin_user)
        url = reverse(DETAIL_URL, kwargs={"pk": track.pk})
        client.patch(url, {"name": "Só o Nome Mudou"}, format="json")
        track.refresh_from_db()
        assert track.location == original_location


@pytest.mark.django_db
class TestTrackDelete:
    def test_unauthenticated_returns_401(self, api_client, track):
        url = reverse(DETAIL_URL, kwargs={"pk": track.pk})
        assert api_client.delete(url).status_code == 401

    def test_non_admin_returns_403(self, user, track):
        client = auth_client(user)
        url = reverse(DETAIL_URL, kwargs={"pk": track.pk})
        assert client.delete(url).status_code == 403

    def test_admin_can_delete(self, admin_user, track):
        client = auth_client(admin_user)
        url = reverse(DETAIL_URL, kwargs={"pk": track.pk})
        res = client.delete(url)
        assert res.status_code == 204
        assert not Track.objects.filter(pk=track.pk).exists()

    def test_delete_not_found_returns_404(self, admin_user):
        import uuid

        client = auth_client(admin_user)
        url = reverse(DETAIL_URL, kwargs={"pk": uuid.uuid4()})
        assert client.delete(url).status_code == 404
