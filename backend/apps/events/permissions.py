from rest_framework.permissions import BasePermission


def _is_admin(user) -> bool:
    return hasattr(user, "role") and user.role.is_admin


def _get_championship_from_obj(obj):
    """Sobe a hierarquia Heat → Event → Championship ou HeatResult → Heat → ..."""
    from apps.championships.models import Championship

    from .models import Event, Heat, HeatResult, LapTelemetry

    if isinstance(obj, Championship):
        return obj
    if isinstance(obj, Event):
        return obj.championship
    if isinstance(obj, Heat):
        return obj.event.championship
    if isinstance(obj, HeatResult):
        return obj.heat.event.championship
    if isinstance(obj, LapTelemetry):
        return obj.heat_result.heat.event.championship
    return None


class IsEventOrganizer(BasePermission):
    """Organizer do campeonato da hierarquia ou admin."""

    def has_object_permission(self, request, view, obj) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        if _is_admin(request.user):
            return True
        championship = _get_championship_from_obj(obj)
        if championship is None or not hasattr(request.user, "profile"):
            return False
        return championship.organizer_id == request.user.profile.pk
