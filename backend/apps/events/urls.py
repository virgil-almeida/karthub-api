from django.urls import path

from . import views
from .standings_views import ChampionshipStandingsView, StandingsView

urlpatterns = [
    # Standings
    path("standings/", StandingsView.as_view(), name="standings"),
    path("championships/<uuid:pk>/standings/", ChampionshipStandingsView.as_view(), name="championship-standings"),
    # Events
    path("events/", views.EventListCreateView.as_view(), name="event-list"),
    path("events/<uuid:pk>/", views.EventDetailView.as_view(), name="event-detail"),
    path("championships/<uuid:championship_pk>/events/", views.EventListCreateView.as_view(), name="championship-events"),
    # Heats
    path("events/<uuid:event_pk>/heats/", views.HeatListCreateView.as_view(), name="heat-list"),
    path("heats/<uuid:pk>/", views.HeatDetailView.as_view(), name="heat-detail"),
    # Heat Results
    path("heats/<uuid:heat_pk>/results/", views.HeatResultListCreateView.as_view(), name="heat-result-list"),
    path("heats/<uuid:heat_pk>/results/bulk/", views.HeatResultBulkCreateView.as_view(), name="heat-result-bulk"),
    path("heat-results/<uuid:pk>/", views.HeatResultDetailView.as_view(), name="heat-result-detail"),
    path("heat-results/<uuid:pk>/payment/", views.HeatResultPaymentView.as_view(), name="heat-result-payment"),
    # Lap Telemetry
    path("heat-results/<uuid:heat_result_pk>/telemetry/", views.LapTelemetryListCreateView.as_view(), name="lap-telemetry-list"),
    path("telemetry/<uuid:pk>/", views.LapTelemetryDetailView.as_view(), name="lap-telemetry-detail"),
]
