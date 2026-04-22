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
class TestStandingsView:
    def test_standings_requires_auth(self, client):
        url = reverse("standings")
        response = client.get(url)
        assert response.status_code == 401

    def test_standings_empty(self, auth_client):
        client, _ = auth_client
        url = reverse("standings")
        response = client.get(url)
        assert response.status_code == 200
        assert response.json() == []

    def test_standings_aggregates_results(self, auth_client, make_user, make_heat, make_heat_result):
        client, _ = auth_client
        driver = make_user()

        heat = make_heat()
        make_heat_result(heat=heat, driver=driver, position=1, points=15)
        make_heat_result(heat=make_heat(), driver=driver, position=2, points=12)

        url = reverse("standings")
        response = client.get(url)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        stats = data[0]["stats"]
        assert stats["totalPoints"] == 27
        assert stats["totalRaces"] == 2
        assert stats["wins"] == 1
        assert stats["podiums"] == 2
        assert stats["bestPosition"] == 1

    def test_standings_ordered_by_points(self, auth_client, make_user, make_heat, make_heat_result):
        client, _ = auth_client
        driver1 = make_user()
        driver2 = make_user()

        make_heat_result(heat=make_heat(), driver=driver1, position=1, points=25)
        make_heat_result(heat=make_heat(), driver=driver2, position=2, points=18)

        url = reverse("standings")
        response = client.get(url)
        data = response.json()
        assert len(data) == 2
        assert data[0]["stats"]["totalPoints"] > data[1]["stats"]["totalPoints"]


@pytest.mark.django_db
class TestChampionshipStandingsView:
    def test_championship_standings_filters_by_championship(
        self, auth_client, make_user, make_championship, make_event, make_heat, make_heat_result
    ):
        client, _ = auth_client
        driver1 = make_user()
        driver2 = make_user()

        champ1 = make_championship()
        champ2 = make_championship()

        event1 = make_event(championship=champ1)
        event2 = make_event(championship=champ2)

        heat1 = make_heat(event=event1)
        heat2 = make_heat(event=event2)

        make_heat_result(heat=heat1, driver=driver1, position=1, points=25)
        make_heat_result(heat=heat2, driver=driver2, position=1, points=25)

        url = reverse("championship-standings", kwargs={"pk": champ1.pk})
        response = client.get(url)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["profile"]["id"] == str(driver1.pk)

    def test_championship_standings_requires_auth(self, client, make_championship):
        champ = make_championship()
        url = reverse("championship-standings", kwargs={"pk": champ.pk})
        response = client.get(url)
        assert response.status_code == 401

    def test_championship_standings_unknown_id_returns_empty(self, auth_client):
        import uuid

        client, _ = auth_client
        url = reverse("championship-standings", kwargs={"pk": uuid.uuid4()})
        response = client.get(url)
        assert response.status_code == 200
        assert response.json() == []
