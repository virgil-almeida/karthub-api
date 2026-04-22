import datetime

import pytest
from django.urls import reverse
from rest_framework.test import APIClient


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def auth_client(client, make_user):
    user = make_user()
    client.force_authenticate(user=user)
    return client, user


@pytest.mark.django_db
class TestRacesListView:
    def test_requires_auth(self, client):
        response = client.get(reverse("analytics-races"))
        assert response.status_code == 401

    def test_empty_returns_empty_list(self, auth_client):
        client, _ = auth_client
        response = client.get(reverse("analytics-races"))
        assert response.status_code == 200
        assert response.json() == []

    def test_includes_championship_heats(self, auth_client, make_heat, make_heat_result):
        client, user = auth_client
        heat = make_heat()
        make_heat_result(heat=heat, driver=user, position=1)

        response = client.get(reverse("analytics-races"))
        data = response.json()
        assert len(data) == 1
        assert data[0]["type"] == "championship"
        assert data[0]["id"].startswith("champ_")

    def test_includes_standalone_races(self, auth_client, make_standalone_race):
        client, user = auth_client
        make_standalone_race(user=user, race_type="training", track_name="Pista XYZ")

        response = client.get(reverse("analytics-races"))
        data = response.json()
        assert len(data) == 1
        assert data[0]["type"] == "training"
        assert data[0]["id"].startswith("standalone_")
        assert data[0]["trackName"] == "Pista XYZ"

    def test_filter_championship_only(self, auth_client, make_heat, make_heat_result, make_standalone_race):
        client, user = auth_client
        make_heat_result(heat=make_heat(), driver=user, position=1)
        make_standalone_race(user=user)

        response = client.get(reverse("analytics-races"), {"filter": "championship"})
        data = response.json()
        assert all(r["type"] == "championship" for r in data)

    def test_filter_training_only(self, auth_client, make_heat, make_heat_result, make_standalone_race):
        client, user = auth_client
        make_heat_result(heat=make_heat(), driver=user, position=1)
        make_standalone_race(user=user, race_type="training")
        make_standalone_race(user=user, race_type="standalone")

        response = client.get(reverse("analytics-races"), {"filter": "training"})
        data = response.json()
        assert all(r["type"] == "training" for r in data)

    def test_does_not_show_other_users_races(self, auth_client, make_user, make_heat, make_heat_result):
        client, _ = auth_client
        other = make_user()
        make_heat_result(heat=make_heat(), driver=other, position=1)

        response = client.get(reverse("analytics-races"))
        assert response.json() == []


@pytest.mark.django_db
class TestBestLapEvolutionView:
    def test_requires_auth(self, client):
        response = client.get(reverse("analytics-best-lap-evolution"))
        assert response.status_code == 401

    def test_returns_sorted_by_date(self, auth_client, make_heat, make_heat_result, make_event, make_championship):
        client, user = auth_client

        champ = make_championship()
        event1 = make_event(championship=champ, date=datetime.date(2025, 3, 1))
        event2 = make_event(championship=champ, date=datetime.date(2025, 1, 1))

        from apps.events.models import Heat

        heat1 = Heat.objects.create(event=event1, name="H1")
        heat2 = Heat.objects.create(event=event2, name="H2")

        make_heat_result(heat=heat1, driver=user, position=1, best_lap_time="1:02.345")
        make_heat_result(heat=heat2, driver=user, position=2, best_lap_time="1:03.000")

        response = client.get(reverse("analytics-best-lap-evolution"))
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        # Earlier date should be first
        assert data[0]["date"] < data[1]["date"]
        assert data[0]["bestLapStr"] == "1:03.000"


@pytest.mark.django_db
class TestTrackComparisonView:
    def test_requires_auth(self, client):
        response = client.get(reverse("analytics-track-comparison"))
        assert response.status_code == 401

    def test_aggregates_by_track(self, auth_client, make_standalone_race):
        client, user = auth_client
        make_standalone_race(user=user, track_name="Pista A", best_lap_time="1:02.345")
        make_standalone_race(user=user, track_name="Pista A", best_lap_time="1:03.000")
        make_standalone_race(user=user, track_name="Pista B", best_lap_time="58.500")

        response = client.get(reverse("analytics-track-comparison"))
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        pista_a = next(r for r in data if r["trackName"] == "Pista A")
        assert pista_a["totalRaces"] == 2
        assert pista_a["bestLapStr"] != "-"


@pytest.mark.django_db
class TestKPIsView:
    def test_requires_auth(self, client):
        response = client.get(reverse("analytics-kpis"))
        assert response.status_code == 401

    def test_empty_returns_zeros(self, auth_client):
        client, _ = auth_client
        response = client.get(reverse("analytics-kpis"))
        assert response.status_code == 200
        data = response.json()
        assert data["totalRaces"] == 0
        assert data["podiumRate"] == 0
        assert data["bestLapAllTime"] is None

    def test_counts_races_and_podiums(self, auth_client, make_heat, make_heat_result):
        client, user = auth_client
        make_heat_result(heat=make_heat(), driver=user, position=1, best_lap_time="1:02.345")
        make_heat_result(heat=make_heat(), driver=user, position=3, best_lap_time="1:03.000")
        make_heat_result(heat=make_heat(), driver=user, position=5)

        response = client.get(reverse("analytics-kpis"))
        data = response.json()
        assert data["totalRaces"] == 3
        assert data["podiumRate"] == 67  # 2/3 rounded
        assert data["bestLapAllTime"] is not None


@pytest.mark.django_db
class TestHeadToHeadView:
    def test_requires_auth(self, client):
        response = client.get(reverse("analytics-head-to-head"))
        assert response.status_code == 401

    def test_missing_params_returns_400(self, auth_client):
        client, _ = auth_client
        response = client.get(reverse("analytics-head-to-head"))
        assert response.status_code == 400

    def test_same_driver_returns_400(self, auth_client, make_user):
        client, _ = auth_client
        user = make_user()
        response = client.get(
            reverse("analytics-head-to-head"),
            {"driver_id_1": str(user.pk), "driver_id_2": str(user.pk)},
        )
        assert response.status_code == 400

    def test_no_common_heats_returns_204(self, auth_client, make_user, make_heat, make_heat_result):
        client, _ = auth_client
        d1 = make_user()
        d2 = make_user()
        make_heat_result(heat=make_heat(), driver=d1, position=1)
        make_heat_result(heat=make_heat(), driver=d2, position=1)

        response = client.get(
            reverse("analytics-head-to-head"),
            {"driver_id_1": str(d1.pk), "driver_id_2": str(d2.pk)},
        )
        assert response.status_code == 204

    def test_common_heats_returns_stats(self, auth_client, make_user, make_heat, make_heat_result):
        client, _ = auth_client
        d1 = make_user()
        d2 = make_user()
        heat = make_heat()
        make_heat_result(heat=heat, driver=d1, position=1, points=25)
        make_heat_result(heat=heat, driver=d2, position=2, points=18)

        response = client.get(
            reverse("analytics-head-to-head"),
            {"driver_id_1": str(d1.pk), "driver_id_2": str(d2.pk)},
        )
        assert response.status_code == 200
        data = response.json()
        assert data is not None
        assert data["driver1"]["wins"] == 1
        assert data["driver2"]["wins"] == 0
        assert len(data["commonHeats"]) == 1


@pytest.mark.django_db
class TestLapEvolutionView:
    def test_requires_auth(self, client):
        response = client.get(reverse("analytics-lap-evolution"))
        assert response.status_code == 401

    def test_returns_lap_data_for_valid_race_id(
        self, auth_client, make_heat, make_heat_result, make_lap_telemetry
    ):
        client, user = auth_client
        hr = make_heat_result(heat=make_heat(), driver=user, position=1)
        make_lap_telemetry(heat_result=hr, lap_number=1, lap_time="1:02.345")
        make_lap_telemetry(heat_result=hr, lap_number=2, lap_time="1:03.100")

        race_id = f"champ_{hr.pk}"
        response = client.get(reverse("analytics-lap-evolution"), {"race_ids": race_id})
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert len(data[0]["laps"]) == 2

    def test_ignores_race_id_belonging_to_other_user(
        self, auth_client, make_user, make_heat, make_heat_result, make_lap_telemetry
    ):
        client, _ = auth_client
        other = make_user()
        hr = make_heat_result(heat=make_heat(), driver=other, position=1)
        make_lap_telemetry(heat_result=hr)

        race_id = f"champ_{hr.pk}"
        response = client.get(reverse("analytics-lap-evolution"), {"race_ids": race_id})
        assert response.status_code == 200
        assert response.json() == []
