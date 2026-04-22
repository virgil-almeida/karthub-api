from rest_framework.permissions import BasePermission, IsAuthenticated


class HasUserRole(IsAuthenticated):
    """Garante que o usuário autenticado tem um UserRole associado."""

    def has_permission(self, request, view) -> bool:
        if not super().has_permission(request, view):
            return False
        return hasattr(request.user, "role")


class IsUserTierOrHigher(HasUserRole):
    def has_permission(self, request, view) -> bool:
        return (
            super().has_permission(request, view)
            and request.user.role.has_tier_or_higher("user")
        )


class IsPlusTierOrHigher(HasUserRole):
    def has_permission(self, request, view) -> bool:
        return (
            super().has_permission(request, view)
            and request.user.role.has_tier_or_higher("plus")
        )


class IsModeratorOrHigher(HasUserRole):
    def has_permission(self, request, view) -> bool:
        return (
            super().has_permission(request, view)
            and request.user.role.has_tier_or_higher("moderator")
        )


class IsAdminTier(HasUserRole):
    def has_permission(self, request, view) -> bool:
        return (
            super().has_permission(request, view)
            and request.user.role.is_admin
        )


class IsOwnerOrAdmin(BasePermission):
    """Object-level: dono do objeto ou admin."""

    def has_object_permission(self, request, view, obj) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        if hasattr(request.user, "role") and request.user.role.is_admin:
            return True
        # Tenta owner_id, user_id ou pk do objeto
        for attr in ("user_id", "owner_id"):
            if hasattr(obj, attr) and getattr(obj, attr) == request.user.pk:
                return True
        return hasattr(obj, "pk") and obj.pk == request.user.pk
