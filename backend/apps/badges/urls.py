from django.urls import path

from . import views

urlpatterns = [
    path("badges/definitions/", views.BadgeDefinitionListCreateView.as_view(), name="badge-definition-list"),
    path("badges/definitions/<uuid:pk>/", views.BadgeDefinitionDetailView.as_view(), name="badge-definition-detail"),
    path("badges/assigned/", views.DriverBadgeListCreateView.as_view(), name="driver-badge-list"),
    path("badges/assigned/<uuid:pk>/", views.DriverBadgeDeleteView.as_view(), name="driver-badge-delete"),
]
