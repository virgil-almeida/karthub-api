from django.urls import path

from . import views

urlpatterns = [
    path("championships/", views.ChampionshipListCreateView.as_view(), name="championship-list"),
    path("championships/mine/", views.MyChampionshipsView.as_view(), name="championship-mine"),
    path("championships/<uuid:pk>/", views.ChampionshipDetailView.as_view(), name="championship-detail"),
    path(
        "championships/<uuid:championship_pk>/members/",
        views.ChampionshipMemberListCreateView.as_view(),
        name="championship-member-list",
    ),
    path(
        "championships/<uuid:championship_pk>/members/<uuid:member_pk>/",
        views.ChampionshipMemberDetailView.as_view(),
        name="championship-member-detail",
    ),
]
