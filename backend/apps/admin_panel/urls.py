from django.urls import path

from . import views

urlpatterns = [
    path("feature-visibility/", views.FeatureVisibilityListView.as_view(), name="feature-visibility-list"),
    path("feature-visibility/<uuid:pk>/", views.FeatureVisibilityDetailView.as_view(), name="feature-visibility-detail"),
    path("users/", views.AdminUserListView.as_view(), name="admin-user-list"),
    path("users/<uuid:user_pk>/tier/", views.AdminUserTierView.as_view(), name="admin-user-tier"),
]
