from django.urls import path, include
from .views import FollowView, FollowersList, FollowingList, RaceViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register(r'races', RaceViewSet, basename='race')

urlpatterns = [
    path('pilots/<int:id>/follow/',     FollowView.as_view()),
    path('pilots/<int:id>/followers/',  FollowersList.as_view()),
    path('pilots/<int:id>/following/',  FollowingList.as_view()),
    path('', include(router.urls)),
]