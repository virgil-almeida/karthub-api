from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, viewsets
from django.shortcuts import get_object_or_404
from .models import PilotProfile, Follow, Race
from .serializers import PilotProfileSerializer, RaceSerializer

#seguir
class FollowView(APIView):
    def post(self, request, id):
        following = get_object_or_404(PilotProfile, id=id)
        follower  = get_object_or_404(PilotProfile, id=request.data['follower_id'])
        Follow.objects.get_or_create(follower=follower, following=following)
        return Response({'status': 'seguindo'}, status=status.HTTP_201_CREATED)
    
    #deixar de seguir
    def delete(self, request, id):       
        following = get_object_or_404(PilotProfile, id=id)
        follower  = get_object_or_404(PilotProfile, id=request.data['follower_id'])
        Follow.objects.filter(follower=follower, following=following).delete()
        return Response({'status': 'deixou de seguir'}, status=status.HTTP_204_NO_CONTENT)

#lista seguidores
class FollowersList(APIView):
    def get(self, request, id):           
        pilot = get_object_or_404(PilotProfile, id=id)
        followers = PilotProfile.objects.filter(following_set__following=pilot)
        serializer = PilotProfileSerializer(followers, many=True)
        return Response(serializer.data)

#quem o piloto segue
class FollowingList(APIView):
    def get(self, request, id):           
        pilot = get_object_or_404(PilotProfile, id=id)
        following = PilotProfile.objects.filter(followers_set__follower=pilot)
        serializer = PilotProfileSerializer(following, many=True)
        return Response(serializer.data)
    
#requisição corrida
class RaceViewSet(viewsets.ModelViewSet):
    serializer_class = RaceSerializer

    def get_queryset(self):
        queryset = Race.objects.all()

        pilot = self.request.query_params.get('pilot')
        track = self.request.query_params.get('track')

        #filtrar
        if pilot:
            queryset = queryset.filter(pilot=pilot)
        if track:
            queryset = queryset.filter(track=track)
        return queryset