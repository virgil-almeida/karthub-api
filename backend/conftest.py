from django.conf import settings


def pytest_configure(config):
    settings.DJANGO_SETTINGS_MODULE = "config.settings.development"


# Re-export all shared factories so every test module can use them
from conftest_factories import (  # noqa: E402, F401
    make_championship,
    make_event,
    make_heat,
    make_heat_result,
    make_lap_telemetry,
    make_standalone_race,
    make_track,
    make_user,
)
