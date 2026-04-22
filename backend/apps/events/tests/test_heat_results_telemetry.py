"""Testes para HeatResults (CRUD, bulk, payment) e LapTelemetry."""
import datetime

import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import SubscriptionTier, User
from apps.championships.models import Championship
from apps.events.models import Event, Heat, HeatResult, LapTelemetry
from apps.tracks.models import Track


def auth_client(user: User) -> APIClient:
    c = APIClient()
    token = RefreshToken.for_user(user)
    c.credentials(HTTP_AUTHORIZATION=f"Bearer {str(token.access_token)}")
    return c


# ─── Fixtures ─────────────────────────────────────────────────────────────────

@pytest.fixture
def organizer(db):
    u = User.objects.create_user(email="org@test.com", password="senha123")
    u.role.tier = SubscriptionTier.PLUS
    u.role.save()
    return u


@pytest.fixture
def driver(db):
    return User.objects.create_user(email="driver@test.com", password="senha123")


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
    return Championship.objects.create(name="Copa", organizer=organizer.profile)


@pytest.fixture
def event(db, championship):
    track = Track.objects.create(name="Pista", location="SP")
    return Event.objects.create(
        championship=championship, track=track, name="Etapa", date=datetime.date(2025, 6, 1)
    )


@pytest.fixture
def heat(db, event):
    return Heat.objects.create(event=event, name="Bateria 1")


@pytest.fixture
def result(db, heat, driver):
    return HeatResult.objects.create(
        heat=heat,
        driver=driver.profile,
        position=1,
        points=25,
        best_lap_time="1:02.345",
        payment_status=False,
    )


@pytest.fixture
def result_no_driver(db, heat):
    return HeatResult.objects.create(
        heat=heat, driver_name_text="Piloto Sem Cadastro", position=2, points=18
    )


# ─── HeatResults: list ────────────────────────────────────────────────────────

@pytest.mark.django_db
class TestHeatResultList:
    def _url(self, heat_pk):
        return reverse("heat-result-list", kwargs={"heat_pk": heat_pk})

    def test_unauthenticated_returns_401(self, heat):
        assert APIClient().get(self._url(heat.pk)).status_code == 401

    def test_authenticated_can_list(self, other_user, heat, result):
        res = auth_client(other_user).get(self._url(heat.pk))
        assert res.status_code == 200
        assert any(r["id"] == str(result.id) for r in res.json())

    def test_payment_status_not_exposed_to_strangers(self, other_user, heat, result):
        res = auth_client(other_user).get(self._url(heat.pk))
        for item in res.json():
            assert "payment_status" not in item


# ─── HeatResults: create ──────────────────────────────────────────────────────

@pytest.mark.django_db
class TestHeatResultCreate:
    def _url(self, heat_pk):
        return reverse("heat-result-list", kwargs={"heat_pk": heat_pk})

    def test_unauthenticated_returns_401(self, heat):
        assert APIClient().post(self._url(heat.pk), {}, format="json").status_code == 401

    def test_organizer_can_create(self, organizer, heat, driver):
        res = auth_client(organizer).post(
            self._url(heat.pk),
            {
                "driver_id": str(driver.profile.pk),
                "position": 1,
                "points": 25,
                "best_lap_time": "1:01.500",
            },
            format="json",
        )
        assert res.status_code == 201
        assert res.json()["position"] == 1

    def test_non_organizer_cannot_create(self, other_user, heat, driver):
        res = auth_client(other_user).post(
            self._url(heat.pk),
            {"position": 1, "points": 10},
            format="json",
        )
        assert res.status_code == 403

    def test_create_without_registered_driver(self, organizer, heat):
        res = auth_client(organizer).post(
            self._url(heat.pk),
            {"driver_name_text": "Visitante", "position": 3, "points": 15},
            format="json",
        )
        assert res.status_code == 201
        assert res.json()["driver_name_text"] == "Visitante"

    def test_missing_position_returns_400(self, organizer, heat):
        res = auth_client(organizer).post(self._url(heat.pk), {"points": 10}, format="json")
        assert res.status_code == 400


# ─── HeatResults: bulk create ─────────────────────────────────────────────────

@pytest.mark.django_db
class TestHeatResultBulk:
    def _url(self, heat_pk):
        return reverse("heat-result-bulk", kwargs={"heat_pk": heat_pk})

    def test_unauthenticated_returns_401(self, heat):
        assert APIClient().post(self._url(heat.pk), [], format="json").status_code == 401

    def test_organizer_can_bulk_create(self, organizer, heat):
        payload = [
            {"driver_name_text": "Piloto A", "position": 1, "points": 25},
            {"driver_name_text": "Piloto B", "position": 2, "points": 18},
            {"driver_name_text": "Piloto C", "position": 3, "points": 15},
        ]
        res = auth_client(organizer).post(self._url(heat.pk), payload, format="json")
        assert res.status_code == 201
        assert len(res.json()) == 3
        assert HeatResult.objects.filter(heat=heat).count() == 3

    def test_non_organizer_cannot_bulk_create(self, other_user, heat):
        payload = [{"driver_name_text": "X", "position": 1, "points": 10}]
        assert auth_client(other_user).post(self._url(heat.pk), payload, format="json").status_code == 403

    def test_non_list_body_returns_400(self, organizer, heat):
        res = auth_client(organizer).post(
            self._url(heat.pk), {"driver_name_text": "X", "position": 1}, format="json"
        )
        assert res.status_code == 400

    def test_partial_invalid_returns_400(self, organizer, heat):
        payload = [
            {"driver_name_text": "OK", "position": 1, "points": 25},
            {"driver_name_text": "Sem posição"},  # falta position
        ]
        res = auth_client(organizer).post(self._url(heat.pk), payload, format="json")
        assert res.status_code == 400


# ─── HeatResults: detail ──────────────────────────────────────────────────────

@pytest.mark.django_db
class TestHeatResultDetail:
    def _url(self, pk):
        return reverse("heat-result-detail", kwargs={"pk": pk})

    def test_unauthenticated_returns_401(self, result):
        assert APIClient().get(self._url(result.pk)).status_code == 401

    def test_stranger_gets_public_view(self, other_user, result):
        res = auth_client(other_user).get(self._url(result.pk))
        assert res.status_code == 200
        assert "payment_status" not in res.json()

    def test_driver_sees_own_payment_status(self, driver, result):
        res = auth_client(driver).get(self._url(result.pk))
        assert res.status_code == 200
        assert "payment_status" in res.json()

    def test_organizer_sees_payment_status(self, organizer, result):
        res = auth_client(organizer).get(self._url(result.pk))
        assert "payment_status" in res.json()

    def test_admin_sees_payment_status(self, admin_user, result):
        res = auth_client(admin_user).get(self._url(result.pk))
        assert "payment_status" in res.json()

    def test_not_found_returns_404(self, other_user):
        import uuid
        assert auth_client(other_user).get(self._url(uuid.uuid4())).status_code == 404


# ─── HeatResults: update / delete ─────────────────────────────────────────────

@pytest.mark.django_db
class TestHeatResultUpdateDelete:
    def _url(self, pk):
        return reverse("heat-result-detail", kwargs={"pk": pk})

    def test_organizer_can_update(self, organizer, result):
        res = auth_client(organizer).patch(
            self._url(result.pk), {"best_lap_time": "1:00.000", "points": 26}, format="json"
        )
        assert res.status_code == 200
        result.refresh_from_db()
        assert result.best_lap_time == "1:00.000"

    def test_non_organizer_cannot_update(self, other_user, result):
        assert auth_client(other_user).patch(self._url(result.pk), {"points": 0}, format="json").status_code == 403

    def test_organizer_can_delete(self, organizer, result):
        res = auth_client(organizer).delete(self._url(result.pk))
        assert res.status_code == 204
        assert not HeatResult.objects.filter(pk=result.pk).exists()

    def test_non_organizer_cannot_delete(self, other_user, result):
        assert auth_client(other_user).delete(self._url(result.pk)).status_code == 403


# ─── HeatResults: payment endpoint ────────────────────────────────────────────

@pytest.mark.django_db
class TestHeatResultPayment:
    def _url(self, pk):
        return reverse("heat-result-payment", kwargs={"pk": pk})

    def test_unauthenticated_returns_401(self, result):
        assert APIClient().patch(self._url(result.pk), {}, format="json").status_code == 401

    def test_organizer_can_set_payment(self, organizer, result):
        res = auth_client(organizer).patch(
            self._url(result.pk), {"payment_status": True}, format="json"
        )
        assert res.status_code == 200
        assert res.json()["payment_status"] is True
        result.refresh_from_db()
        assert result.payment_status is True

    def test_non_organizer_cannot_set_payment(self, other_user, result):
        assert auth_client(other_user).patch(
            self._url(result.pk), {"payment_status": True}, format="json"
        ).status_code == 403


# ─── LapTelemetry: list / create ──────────────────────────────────────────────

@pytest.mark.django_db
class TestLapTelemetryList:
    def _url(self, heat_result_pk):
        return reverse("lap-telemetry-list", kwargs={"heat_result_pk": heat_result_pk})

    def test_unauthenticated_returns_401(self, result):
        assert APIClient().get(self._url(result.pk)).status_code == 401

    def test_authenticated_can_list(self, other_user, result):
        LapTelemetry.objects.create(heat_result=result, lap_number=1, lap_time="1:02.345")
        res = auth_client(other_user).get(self._url(result.pk))
        assert res.status_code == 200
        assert len(res.json()) == 1

    def test_organizer_can_add_telemetry(self, organizer, result):
        res = auth_client(organizer).post(
            self._url(result.pk),
            {"lap_number": 1, "lap_time": "1:01.500"},
            format="json",
        )
        assert res.status_code == 201
        assert res.json()["lap_number"] == 1

    def test_driver_can_add_own_telemetry(self, driver, result):
        res = auth_client(driver).post(
            self._url(result.pk),
            {"lap_number": 2, "lap_time": "1:01.800"},
            format="json",
        )
        assert res.status_code == 201

    def test_other_user_cannot_add_telemetry(self, other_user, result):
        res = auth_client(other_user).post(
            self._url(result.pk),
            {"lap_number": 1, "lap_time": "1:02.000"},
            format="json",
        )
        assert res.status_code == 403

    def test_missing_lap_time_returns_400(self, organizer, result):
        res = auth_client(organizer).post(
            self._url(result.pk), {"lap_number": 1}, format="json"
        )
        assert res.status_code == 400


# ─── LapTelemetry: detail / update / delete ───────────────────────────────────

@pytest.mark.django_db
class TestLapTelemetryDetail:
    def _url(self, pk):
        return reverse("lap-telemetry-detail", kwargs={"pk": pk})

    @pytest.fixture
    def lap(self, db, result):
        return LapTelemetry.objects.create(heat_result=result, lap_number=1, lap_time="1:02.345")

    def test_organizer_can_update(self, organizer, lap):
        res = auth_client(organizer).patch(
            self._url(lap.pk), {"lap_time": "1:01.999"}, format="json"
        )
        assert res.status_code == 200
        lap.refresh_from_db()
        assert lap.lap_time == "1:01.999"

    def test_non_organizer_cannot_update(self, other_user, lap):
        assert auth_client(other_user).patch(self._url(lap.pk), {"lap_time": "X"}, format="json").status_code == 403

    def test_organizer_can_delete(self, organizer, lap):
        res = auth_client(organizer).delete(self._url(lap.pk))
        assert res.status_code == 204
        assert not LapTelemetry.objects.filter(pk=lap.pk).exists()

    def test_non_organizer_cannot_delete(self, other_user, lap):
        assert auth_client(other_user).delete(self._url(lap.pk)).status_code == 403
