import io

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from PIL import Image
from rest_framework.test import APIClient


def _make_image_bytes(fmt="PNG", size=(100, 100)) -> bytes:
    buf = io.BytesIO()
    img = Image.new("RGB", size, color=(255, 0, 0))
    img.save(buf, format=fmt)
    return buf.getvalue()


@pytest.fixture
def client():
    return APIClient()


@pytest.mark.django_db
class TestProfileAvatarUpload:
    def _url(self, pk):
        return reverse("profile-avatar-upload", kwargs={"pk": pk})

    def test_upload_requires_auth(self, client, make_user):
        user = make_user()
        response = client.post(self._url(user.pk), {}, format="multipart")
        assert response.status_code == 401

    def test_owner_can_upload_avatar(self, client, make_user):
        user = make_user()
        client.force_authenticate(user=user)

        img_bytes = _make_image_bytes()
        upload = SimpleUploadedFile("avatar.png", img_bytes, content_type="image/png")
        response = client.post(self._url(user.pk), {"avatar": upload}, format="multipart")

        assert response.status_code == 200
        assert "avatar_url" in response.json()

    def test_other_user_cannot_upload_avatar(self, client, make_user):
        owner = make_user()
        other = make_user()
        client.force_authenticate(user=other)

        img_bytes = _make_image_bytes()
        upload = SimpleUploadedFile("avatar.png", img_bytes, content_type="image/png")
        response = client.post(self._url(owner.pk), {"avatar": upload}, format="multipart")

        assert response.status_code == 403

    def test_no_file_returns_400(self, client, make_user):
        user = make_user()
        client.force_authenticate(user=user)
        response = client.post(self._url(user.pk), {}, format="multipart")
        assert response.status_code == 400

    def test_invalid_mime_type_returns_400(self, client, make_user):
        user = make_user()
        client.force_authenticate(user=user)

        upload = SimpleUploadedFile(
            "malware.exe", b"binary-data", content_type="application/octet-stream"
        )
        response = client.post(self._url(user.pk), {"avatar": upload}, format="multipart")
        assert response.status_code == 400

    def test_file_too_large_returns_400(self, client, make_user):
        user = make_user()
        client.force_authenticate(user=user)

        # 3 MB of data exceeds the 2 MB limit
        large_bytes = b"x" * (3 * 1024 * 1024)
        upload = SimpleUploadedFile("large.png", large_bytes, content_type="image/png")
        response = client.post(self._url(user.pk), {"avatar": upload}, format="multipart")
        assert response.status_code == 400

    def test_admin_can_upload_avatar_for_another_user(self, client, make_user):
        from apps.accounts.models import SubscriptionTier

        owner = make_user()
        admin = make_user()
        admin.role.tier = SubscriptionTier.ADMIN
        admin.role.save()

        client.force_authenticate(user=admin)
        img_bytes = _make_image_bytes()
        upload = SimpleUploadedFile("avatar.png", img_bytes, content_type="image/png")
        response = client.post(self._url(owner.pk), {"avatar": upload}, format="multipart")
        assert response.status_code == 200
