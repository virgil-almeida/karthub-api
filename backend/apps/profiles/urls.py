from django.urls import path

from apps.badges.views import ProfileBadgesView

from . import views

urlpatterns = [
    path("profiles/", views.ProfileListView.as_view(), name="profile-list"),
    path("profiles/ensure/", views.ProfileEnsureView.as_view(), name="profile-ensure"),
    path("profiles/<uuid:pk>/", views.ProfileDetailView.as_view(), name="profile-detail"),
    path("profiles/<uuid:pk>/can-view-weight/", views.ProfileCanViewWeightView.as_view(), name="profile-can-view-weight"),
    path("profiles/<uuid:pk>/avatar/", views.ProfileAvatarUploadView.as_view(), name="profile-avatar-upload"),
    path("profiles/<uuid:profile_pk>/badges/", ProfileBadgesView.as_view(), name="profile-badges"),
]
