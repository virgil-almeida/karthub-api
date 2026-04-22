import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.accounts.models import User


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def user(db):
    return User.objects.create_user(email="piloto@test.com", password="senha123")


@pytest.mark.django_db
class TestRegister:
    def test_register_returns_tokens_and_user(self, api_client):
        url = reverse("auth-register")
        response = api_client.post(
            url,
            {"email": "novo@test.com", "password": "SenhaForte123!", "password_confirm": "SenhaForte123!"},
            format="json",
        )
        assert response.status_code == 201
        data = response.json()
        assert "access" in data
        assert "refresh" in data
        assert data["user"]["email"] == "novo@test.com"

    def test_register_passwords_mismatch(self, api_client):
        url = reverse("auth-register")
        response = api_client.post(
            url,
            {"email": "novo@test.com", "password": "SenhaForte123!", "password_confirm": "outra"},
            format="json",
        )
        assert response.status_code == 400

    def test_register_duplicate_email(self, api_client, user):
        url = reverse("auth-register")
        response = api_client.post(
            url,
            {"email": "piloto@test.com", "password": "SenhaForte123!", "password_confirm": "SenhaForte123!"},
            format="json",
        )
        assert response.status_code == 400


@pytest.mark.django_db
class TestLogin:
    def test_login_returns_tokens_and_user(self, api_client, user):
        url = reverse("auth-login")
        response = api_client.post(
            url,
            {"email": "piloto@test.com", "password": "senha123"},
            format="json",
        )
        assert response.status_code == 200
        data = response.json()
        assert "access" in data
        assert "refresh" in data
        assert data["user"]["email"] == "piloto@test.com"
        assert "role" in data["user"]

    def test_login_wrong_password(self, api_client, user):
        url = reverse("auth-login")
        response = api_client.post(
            url,
            {"email": "piloto@test.com", "password": "errada"},
            format="json",
        )
        assert response.status_code == 401


@pytest.mark.django_db
class TestMe:
    def test_me_returns_user_data(self, api_client, user):
        api_client.force_authenticate(user=user)
        url = reverse("auth-me")
        response = api_client.get(url)
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == user.email
        assert "role" in data

    def test_me_requires_auth(self, api_client):
        url = reverse("auth-me")
        response = api_client.get(url)
        assert response.status_code == 401


@pytest.mark.django_db
class TestLogout:
    def test_logout_blacklists_token(self, api_client, user):
        # Login para obter tokens reais
        login_url = reverse("auth-login")
        login_response = api_client.post(
            login_url,
            {"email": "piloto@test.com", "password": "senha123"},
            format="json",
        )
        refresh_token = login_response.json()["refresh"]

        api_client.force_authenticate(user=user)
        logout_url = reverse("auth-logout")
        response = api_client.post(logout_url, {"refresh": refresh_token}, format="json")
        assert response.status_code == 204

    def test_logout_requires_refresh_token(self, api_client, user):
        api_client.force_authenticate(user=user)
        url = reverse("auth-logout")
        response = api_client.post(url, {}, format="json")
        assert response.status_code == 400
