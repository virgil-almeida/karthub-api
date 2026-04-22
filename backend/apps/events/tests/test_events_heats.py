"""Testes para Events e Heats (GET/POST/PATCH/DELETE)."""
import datetime

import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import SubscriptionTier, User
from apps.championships.models import Championship
from apps.events.models import Event, EventStatus, Heat, WeatherCondition
from apps.tracks.models import Track


def auth_client(user: User) -> APIClient:
    c = APIClient()
    token = RefreshToken.for_user(user)
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")
    return c


@pytest.fixture
def organizer(db):
    u = User.objects.create_user(email="org@test.com", password="senha123")
    u.role.tier = SubscriptionTier.PLUS
    u.role.save()
    return u


@pytest.fixture
def other_user(db):
    return User.objects.create_user(email="other@test.com", password="senha123")


@pytest.fixture
def admin_user(db):
    u = User.objects.create_user(email="admin@test.com", password="senha123")
    u.role.tier = SubscriptionTier.ADMIN
    u.role.save()
    return u


@pytest.fixture
def championship(db, organizer):
    return Championship.objects.create(name="Copa Teste", organizer=organizer.profile)


@pytest.fixture
def track(db):
    return Track.objects.create(name="Pista A", location="SP")


@pytest.fixture
def event(db, championship, track):
    return Event.objects.create(
        championship=championship,
        track=track,
        name="Etapa 1",
        date=datetime.date(2025, 6, 1),
    )


@pytest.fixture
def heat(db, event):
    return Heat.objects.create(event=event, name="Bateria 1")


# ─── Events: list ─────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestEventList:
    url = reverse("event-list")

    def test_unauthenticated_returns_401(self):
        assert APIClient().get(self.url).status_code == 401

    def test_authenticated_can_list(self, other_user, event):
        res = auth_client(other_user).get(self.url)
        assert res.status_code == 200
        assert any(e["id"] == str(event.id) for e in res.json())

    def test_filter_by_championship_id_query_param(self, other_user, championship, event):
        other_champ = Championship.objects.create(name="Outra Copa")
        Event.objects.create(
            championship=other_champ,
            name="Etapa Outra",
            date=datetime.date(2025, 7, 1),
        )
        res = auth_client(other_user).get(self.url, {"championship_id": str(championship.id)})
        assert res.status_code == 200
        ids = [e["id"] for e in res.json()]
        assert str(event.id) in ids
        assert all(e["championship_id"] == str(championship.id) for e in res.json())

    def test_nested_route_filters_by_championship(self, other_user, championship, event):
        url = reverse("championship-events", kwargs={"championship_pk": championship.pk})
        res = auth_client(other_user).get(url)
        assert res.status_code == 200
        ids = [e["id"] for e in res.json()]
        assert str(event.id) in ids

    def test_response_includes_track_and_championship_name(self, other_user, event):
        res = auth_client(other_user).get(self.url)
        item = next(e for e in res.json() if e["id"] == str(event.id))
        assert "track" in item
        assert "championship_name" in item


# ─── Events: create ───────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestEventCreate:
    url = reverse("event-list")

    def _payload(self, championship, track):
        return {
            "championship_id": str(championship.id),
            "track_id": str(track.id),
            "name": "Nova Etapa",
            "date": "2025-08-01",
        }

    def test_unauthenticated_returns_401(self, championship, track):
        assert APIClient().post(self.url, self._payload(championship, track), format="json").status_code == 401

    def test_organizer_can_create(self, organizer, championship, track):
        res = auth_client(organizer).post(self.url, self._payload(championship, track), format="json")
        assert res.status_code == 201
        assert res.json()["name"] == "Nova Etapa"

    def test_non_organizer_returns_403(self, other_user, championship, track):
        res = auth_client(other_user).post(self.url, self._payload(championship, track), format="json")
        assert res.status_code == 403

    def test_create_via_nested_route(self, organizer, championship, track):
        url = reverse("championship-events", kwargs={"championship_pk": championship.pk})
        payload = {"track_id": str(track.id), "name": "Via Nested", "date": "2025-09-01"}
        res = auth_client(organizer).post(url, payload, format="json")
        assert res.status_code == 201
        assert res.json()["championship_id"] == str(championship.id)

    def test_admin_can_create(self, admin_user, championship, track):
        res = auth_client(admin_user).post(self.url, self._payload(championship, track), format="json")
        assert res.status_code == 201

    def test_missing_required_field_returns_400(self, organizer, championship):
        res = auth_client(organizer).post(
            self.url, {"championship_id": str(championship.id), "name": "Sem Data"}, format="json"
        )
        assert res.status_code == 400


# ─── Events: detail ───────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestEventDetail:
    def _url(self, pk):
        return reverse("event-detail", kwargs={"pk": pk})

    def test_unauthenticated_returns_401(self, event):
        assert APIClient().get(self._url(event.pk)).status_code == 401

    def test_authenticated_can_get(self, other_user, event):
        res = auth_client(other_user).get(self._url(event.pk))
        assert res.status_code == 200
        assert res.json()["id"] == str(event.id)

    def test_not_found_returns_404(self, other_user):
        import uuid
        res = auth_client(other_user).get(self._url(uuid.uuid4()))
        assert res.status_code == 404


# ─── Events: update / delete ──────────────────────────────────────────────────

@pytest.mark.django_db
class TestEventUpdateDelete:
    def _url(self, pk):
        return reverse("event-detail", kwargs={"pk": pk})

    def test_organizer_can_update(self, organizer, event):
        res = auth_client(organizer).patch(
            self._url(event.pk), {"name": "Etapa Atualizada", "status": "in_progress"}, format="json"
        )
        assert res.status_code == 200
        event.refresh_from_db()
        assert event.name == "Etapa Atualizada"
        assert event.status == EventStatus.IN_PROGRESS

    def test_non_organizer_cannot_update(self, other_user, event):
        res = auth_client(other_user).patch(self._url(event.pk), {"name": "X"}, format="json")
        assert res.status_code == 403

    def test_admin_can_update(self, admin_user, event):
        res = auth_client(admin_user).patch(self._url(event.pk), {"name": "Admin Edit"}, format="json")
        assert res.status_code == 200

    def test_organizer_can_delete(self, organizer, event):
        res = auth_client(organizer).delete(self._url(event.pk))
        assert res.status_code == 204
        assert not Event.objects.filter(pk=event.pk).exists()

    def test_non_organizer_cannot_delete(self, other_user, event):
        res = auth_client(other_user).delete(self._url(event.pk))
        assert res.status_code == 403


# ─── Heats: list / create ─────────────────────────────────────────────────────

@pytest.mark.django_db
class TestHeatListCreate:
    def _url(self, event_pk):
        return reverse("heat-list", kwargs={"event_pk": event_pk})

    def test_unauthenticated_returns_401(self, event):
        assert APIClient().get(self._url(event.pk)).status_code == 401

    def test_list_heats_of_event(self, other_user, event, heat):
        res = auth_client(other_user).get(self._url(event.pk))
        assert res.status_code == 200
        assert any(h["id"] == str(heat.id) for h in res.json())

    def test_organizer_can_create_heat(self, organizer, event):
        res = auth_client(organizer).post(
            self._url(event.pk),
            {"name": "Bateria 2", "weather_condition": "dry"},
            format="json",
        )
        assert res.status_code == 201
        assert res.json()["event_id"] == str(event.id)

    def test_non_organizer_cannot_create_heat(self, other_user, event):
        res = auth_client(other_user).post(
            self._url(event.pk), {"name": "Invasor"}, format="json"
        )
        assert res.status_code == 403

    def test_admin_can_create_heat(self, admin_user, event):
        res = auth_client(admin_user).post(
            self._url(event.pk), {"name": "Heat Admin"}, format="json"
        )
        assert res.status_code == 201

    def test_missing_name_returns_400(self, organizer, event):
        res = auth_client(organizer).post(self._url(event.pk), {}, format="json")
        assert res.status_code == 400


# ─── Heats: detail / update / delete ─────────────────────────────────────────

@pytest.mark.django_db
class TestHeatDetail:
    def _url(self, pk):
        return reverse("heat-detail", kwargs={"pk": pk})

    def test_unauthenticated_returns_401(self, heat):
        assert APIClient().get(self._url(heat.pk)).status_code == 401

    def test_authenticated_can_get(self, other_user, heat):
        res = auth_client(other_user).get(self._url(heat.pk))
        assert res.status_code == 200
        assert res.json()["id"] == str(heat.id)

    def test_organizer_can_update(self, organizer, heat):
        res = auth_client(organizer).patch(
            self._url(heat.pk),
            {"name": "Bateria Atualizada", "weather_condition": "wet"},
            format="json",
        )
        assert res.status_code == 200
        heat.refresh_from_db()
        assert heat.name == "Bateria Atualizada"
        assert heat.weather_condition == WeatherCondition.WET

    def test_non_organizer_cannot_update(self, other_user, heat):
        res = auth_client(other_user).patch(self._url(heat.pk), {"name": "X"}, format="json")
        assert res.status_code == 403

    def test_organizer_can_delete(self, organizer, heat):
        res = auth_client(organizer).delete(self._url(heat.pk))
        assert res.status_code == 204
        assert not Heat.objects.filter(pk=heat.pk).exists()

    def test_non_organizer_cannot_delete(self, other_user, heat):
        assert auth_client(other_user).delete(self._url(heat.pk)).status_code == 403
