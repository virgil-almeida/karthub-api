from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    # API v1
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/", include("apps.profiles.urls")),
    path("api/v1/", include("apps.tracks.urls")),
    path("api/v1/", include("apps.championships.urls")),
    path("api/v1/", include("apps.events.urls")),
    path("api/v1/", include("apps.races.urls")),
    path("api/v1/", include("apps.badges.urls")),
    path("api/v1/admin/", include("apps.admin_panel.urls")),
    path("api/v1/", include("apps.analytics.urls")),
    # Documentação OpenAPI
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]
