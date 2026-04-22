"""Testes para StandaloneRace e StandaloneRaceTelemetry."""
import datetime

import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.races.models import StandaloneRace, StandaloneRaceTelemetry


def auth_client(user: User) -> APIClient:
    c = APIClient()
    token = RefreshToken.for_user(user)
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")
    return c


@pytest.fixture
def user(db):
    return User.objects.create_user(email="piloto@test.com", password="senha123")


@pytest.fixture
def other_user(db):
    return User.objects.create_user(email="outro@test.com", password="senha123")


@pytest.fixture
def race(db, user):
    return StandaloneRace.objects.create(
        user=user,
        race_type="standalone",
        track_name="Kartódromo Teste",
        date=datetime.date(2025, 5, 10),
        position=1,
        best_lap_time="1:01.234",
    )


@pytest.fixture
def other_race(db, other_user):
    return StandaloneRace.objects.create(
        user=other_user,
        race_type="training",
        track_name="Outra Pista",
        date=datetime.date(2025, 6, 1),
    )


@pytest.fixture
def lap(db, race):
    return StandaloneRaceTelemetry.objects.create(
        standalone_race=race,
        lap_number=1,
        lap_time="1:01.234",
    )


# ─── List ─────────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestStandaloneRaceList:
    url = reverse("standalone-race-list")

    def test_unauthenticated_returns_401(self):
        assert APIClient().get(self.url).status_code == 401

    def test_returns_only_own_races(self, user, race, other_race):
        res = auth_client(user).get(self.url)
        assert res.status_code == 200
        ids = [r["id"] for r in res.json()]
        assert str(race.id) in ids
        assert str(other_race.id) not in ids

    def test_filter_by_type_standalone(self, user, db):
        StandaloneRace.objects.create(user=user, race_type="standalone", date=datetime.date(2025, 1, 1))
        StandaloneRace.objects.create(user=user, race_type="training", date=datetime.date(2025, 1, 2))
        res = auth_client(user).get(self.url, {"type": "standalone"})
        assert res.status_code == 200
        assert all(r["race_type"] == "standalone" for r in res.json())

    def test_filter_by_type_training(self, user, db):
        StandaloneRace.objects.create(user=user, race_type="training", date=datetime.date(2025, 1, 1))
        StandaloneRace.objects.create(user=user, race_type="standalone", date=datetime.date(2025, 1, 2))
        res = auth_client(user).get(self.url, {"type": "training"})
        assert all(r["race_type"] == "training" for r in res.json())

    def test_empty_list_when_no_races(self, user):
        res = auth_client(user).get(self.url)
        assert res.status_code == 200
        assert res.json() == []

    def test_response_fields(self, user, race):
        item = auth_client(user).get(self.url).json()[0]
        assert set(item.keys()) >= {
            "id", "user_id", "race_type", "track_name", "date",
            "position", "best_lap_time", "points",
        }


# ─── Create ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestStandaloneRaceCreate:
    url = reverse("standalone-race-list")

    def test_unauthenticated_returns_401(self):
        assert APIClient().post(self.url, {}, format="json").status_code == 401

    def test_authenticated_can_create(self, user):
        payload = {
            "race_type": "standalone",
            "track_name": "Nova Pista",
            "date": "2025-08-15",
            "position": 2,
            "best_lap_time": "1:03.100",
        }
        res = auth_client(user).post(self.url, payload, format="json")
        assert res.status_code == 201
        assert res.json()["track_name"] == "Nova Pista"
        assert res.json()["user_id"] == str(user.pk)

    def test_race_belongs_to_authenticated_user(self, user, other_user):
        """user_id é sempre o do usuário autenticado, ignorando qualquer outro valor no body."""
        res = auth_client(user).post(
            self.url,
            {"race_type": "training", "date": "2025-08-01"},
            format="json",
        )
        assert res.status_code == 201
        assert StandaloneRace.objects.get(id=res.json()["id"]).user_id == user.pk

    def test_missing_date_returns_400(self, user):
        res = auth_client(user).post(
            self.url, {"race_type": "standalone"}, format="json"
        )
        assert res.status_code == 400

    def test_create_training_race(self, user):
        res = auth_client(user).post(
            self.url,
            {"race_type": "training", "date": "2025-09-01", "track_name": "Treino livre"},
            format="json",
        )
        assert res.status_code == 201
        assert res.json()["race_type"] == "training"


# ─── Delete ───────────────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestStandaloneRaceDelete:
    def _url(self, pk):
        return reverse("standalone-race-detail", kwargs={"pk": pk})

    def test_unauthenticated_returns_401(self, race):
        assert APIClient().delete(self._url(race.pk)).status_code == 401

    def test_owner_can_delete(self, user, race):
        res = auth_client(user).delete(self._url(race.pk))
        assert res.status_code == 204
        assert not StandaloneRace.objects.filter(pk=race.pk).exists()

    def test_other_user_gets_404(self, other_user, race):
        # view usa get_object_or_404(user=request.user), então retorna 404 e não 403
        res = auth_client(other_user).delete(self._url(race.pk))
        assert res.status_code == 404

    def test_not_found_returns_404(self, user):
        import uuid
        assert auth_client(user).delete(self._url(uuid.uuid4())).status_code == 404


# ─── Telemetry list/create ────────────────────────────────────────────────────

@pytest.mark.django_db
class TestStandaloneRaceTelemetryList:
    def _url(self, race_pk):
        return reverse("standalone-race-telemetry-list", kwargs={"race_pk": race_pk})

    def test_unauthenticated_returns_401(self, race):
        assert APIClient().get(self._url(race.pk)).status_code == 401

    def test_owner_can_list_telemetry(self, user, race, lap):
        res = auth_client(user).get(self._url(race.pk))
        assert res.status_code == 200
        assert len(res.json()) == 1
        assert res.json()[0]["id"] == str(lap.id)

    def test_other_user_gets_404(self, other_user, race):
        res = auth_client(other_user).get(self._url(race.pk))
        assert res.status_code == 404

    def test_laps_ordered_by_lap_number(self, user, race):
        StandaloneRaceTelemetry.objects.create(standalone_race=race, lap_number=3, lap_time="1:02.000")
        StandaloneRaceTelemetry.objects.create(standalone_race=race, lap_number=1, lap_time="1:01.500")
        StandaloneRaceTelemetry.objects.create(standalone_race=race, lap_number=2, lap_time="1:01.800")
        res = auth_client(user).get(self._url(race.pk))
        lap_numbers = [l["lap_number"] for l in res.json()]
        assert lap_numbers == sorted(lap_numbers)

    def test_owner_can_add_telemetry(self, user, race):
        res = auth_client(user).post(
            self._url(race.pk),
            {"lap_number": 1, "lap_time": "1:02.500", "sector1": "0:20.100"},
            format="json",
        )
        assert res.status_code == 201
        assert res.json()["lap_number"] == 1
        assert res.json()["standalone_race_id"] == str(race.id)

    def test_other_user_cannot_add_telemetry(self, other_user, race):
        res = auth_client(other_user).post(
            self._url(race.pk),
            {"lap_number": 1, "lap_time": "1:01.000"},
            format="json",
        )
        assert res.status_code == 404

    def test_missing_lap_time_returns_400(self, user, race):
        res = auth_client(user).post(
            self._url(race.pk), {"lap_number": 1}, format="json"
        )
        assert res.status_code == 400

    def test_response_includes_all_telemetry_fields(self, user, race):
        auth_client(user).post(
            self._url(race.pk),
            {
                "lap_number": 1, "lap_time": "1:01.500",
                "sector1": "0:20.500", "sector2": "0:21.000", "sector3": "0:20.000",
                "kart_number": 42,
            },
            format="json",
        )
        item = auth_client(user).get(self._url(race.pk)).json()[0]
        assert set(item.keys()) >= {
            "id", "standalone_race_id", "lap_number", "lap_time",
            "sector1", "sector2", "sector3", "kart_number",
        }


# ─── Telemetry update/delete ──────────────────────────────────────────────────

@pytest.mark.django_db
class TestStandaloneRaceTelemetryDetail:
    def _url(self, pk):
        return reverse("standalone-race-telemetry-detail", kwargs={"pk": pk})

    def test_unauthenticated_returns_401(self, lap):
        assert APIClient().patch(self._url(lap.pk), {}, format="json").status_code == 401

    def test_owner_can_update_lap(self, user, lap):
        res = auth_client(user).patch(
            self._url(lap.pk),
            {"lap_time": "1:00.999", "sector1": "0:20.000"},
            format="json",
        )
        assert res.status_code == 200
        lap.refresh_from_db()
        assert lap.lap_time == "1:00.999"
        assert lap.sector1 == "0:20.000"

    def test_other_user_gets_404_on_update(self, other_user, lap):
        res = auth_client(other_user).patch(
            self._url(lap.pk), {"lap_time": "X"}, format="json"
        )
        assert res.status_code == 404

    def test_owner_can_delete_lap(self, user, lap):
        res = auth_client(user).delete(self._url(lap.pk))
        assert res.status_code == 204
        assert not StandaloneRaceTelemetry.objects.filter(pk=lap.pk).exists()

    def test_other_user_gets_404_on_delete(self, other_user, lap):
        assert auth_client(other_user).delete(self._url(lap.pk)).status_code == 404
