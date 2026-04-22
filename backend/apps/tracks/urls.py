from django.urls import path

from . import views

urlpatterns = [
    path("tracks/", views.TrackListCreateView.as_view(), name="track-list"),
    path("tracks/<uuid:pk>/", views.TrackDetailView.as_view(), name="track-detail"),
]
