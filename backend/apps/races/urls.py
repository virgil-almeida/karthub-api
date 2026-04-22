from django.urls import path

from . import views

urlpatterns = [
    path("standalone-races/", views.StandaloneRaceListCreateView.as_view(), name="standalone-race-list"),
    path("standalone-races/<uuid:pk>/", views.StandaloneRaceDetailView.as_view(), name="standalone-race-detail"),
    path(
        "standalone-races/<uuid:race_pk>/telemetry/",
        views.StandaloneRaceTelemetryListCreateView.as_view(),
        name="standalone-race-telemetry-list",
    ),
    path(
        "standalone-race-telemetry/<uuid:pk>/",
        views.StandaloneRaceTelemetryDetailView.as_view(),
        name="standalone-race-telemetry-detail",
    ),
]
