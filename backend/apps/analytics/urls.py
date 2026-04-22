from django.urls import path

from . import views

urlpatterns = [
    path("analytics/races/", views.RacesListView.as_view(), name="analytics-races"),
    path("analytics/lap-evolution/", views.LapEvolutionView.as_view(), name="analytics-lap-evolution"),
    path("analytics/best-lap-evolution/", views.BestLapEvolutionView.as_view(), name="analytics-best-lap-evolution"),
    path("analytics/track-comparison/", views.TrackComparisonView.as_view(), name="analytics-track-comparison"),
    path("analytics/kpis/", views.KPIsView.as_view(), name="analytics-kpis"),
    path("analytics/head-to-head/", views.HeadToHeadView.as_view(), name="analytics-head-to-head"),
]
