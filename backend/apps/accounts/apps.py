from django.apps import AppConfig


class AccountsConfig(AppConfig):
    name = "apps.accounts"
    verbose_name = "Contas"

    def ready(self) -> None:
        import apps.accounts.signals  # noqa: F401
