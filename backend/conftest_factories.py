"""
Shared test factories available to all apps via conftest.py at the backend root.
"""

import datetime

import pytest

from apps.accounts.models import User
from apps.championships.models import Championship
from apps.events.models import Event, Heat, HeatResult, LapTelemetry
from apps.races.models import StandaloneRace
from apps.tracks.models import Track


@pytest.fixture
def make_user(db):
    counter = {"n": 0}

    def _factory(email=None, password="Senha123!"):
        counter["n"] += 1
        return User.objects.create_user(
            email=email or f"piloto{counter['n']}@test.com",
            password=password,
        )

    return _factory


@pytest.fixture
def make_track(db):
    counter = {"n": 0}

    def _factory(name=None):
        counter["n"] += 1
        return Track.objects.create(
            name=name or f"Pista {counter['n']}",
            location="Cidade Teste, SP",
        )

    return _factory


@pytest.fixture
def make_championship(db, make_user, make_track):
    def _factory(organizer=None, name="Campeonato Teste"):
        user = organizer or make_user()
        # Championship.organizer is a FK to Profile
        profile = user.profile if hasattr(user, "profile") else None
        return Championship.objects.create(
            name=name,
            organizer=profile,
        )

    return _factory


@pytest.fixture
def make_event(db, make_championship, make_track):
    def _factory(championship=None, track=None, date=None):
        championship = championship or make_championship()
        track = track or make_track()
        return Event.objects.create(
            championship=championship,
            track=track,
            name="Evento Teste",
            date=date or datetime.date(2025, 6, 1),
        )

    return _factory


@pytest.fixture
def make_heat(db, make_event):
    def _factory(event=None, name="Bateria 1"):
        event = event or make_event()
        return Heat.objects.create(event=event, name=name)

    return _factory


@pytest.fixture
def make_heat_result(db, make_heat):
    counter = {"n": 0}

    def _factory(heat=None, driver=None, position=1, points=10, best_lap_time=None):
        counter["n"] += 1
        heat = heat or make_heat()
        # Accept User or Profile instances for driver
        from apps.accounts.models import User as UserModel
        from apps.profiles.models import Profile

        profile = None
        if driver is not None:
            if isinstance(driver, UserModel):
                profile = driver.profile
            elif isinstance(driver, Profile):
                profile = driver

        return HeatResult.objects.create(
            heat=heat,
            driver=profile,
            position=position,
            points=points,
            best_lap_time=best_lap_time,
        )

    return _factory


@pytest.fixture
def make_lap_telemetry(db, make_heat_result):
    def _factory(heat_result=None, lap_number=1, lap_time="1:02.345"):
        heat_result = heat_result or make_heat_result()
        return LapTelemetry.objects.create(
            heat_result=heat_result,
            lap_number=lap_number,
            lap_time=lap_time,
        )

    return _factory


@pytest.fixture
def make_standalone_race(db):
    def _factory(user, race_type="standalone", track_name="Pista A", date=None, best_lap_time=None):
        return StandaloneRace.objects.create(
            user=user,
            race_type=race_type,
            track_name=track_name,
            date=date or datetime.date(2025, 5, 1),
            best_lap_time=best_lap_time,
        )

    return _factory
