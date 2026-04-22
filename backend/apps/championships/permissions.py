from rest_framework.permissions import BasePermission


class IsChampionshipOrganizer(BasePermission):
    """Object-level: organizador do campeonato ou admin."""

    def has_object_permission(self, request, view, obj) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        if hasattr(request.user, "role") and request.user.role.is_admin:
            return True
        # obj pode ser Championship ou ChampionshipMember
        championship = getattr(obj, "championship", obj)
        if not hasattr(request.user, "profile"):
            return False
        return championship.organizer_id == request.user.profile.pk
