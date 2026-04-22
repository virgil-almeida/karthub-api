"""
Migração de dados do Supabase → Django (Fase 3).

Uso:
  python manage.py import_from_supabase \\
      --supabase-url https://xxx.supabase.co \\
      --supabase-key <service_role_key> \\
      [--supabase-db-url postgres://...] \\
      [--module users|profiles|tracks|championships|all] \\
      [--dry-run]

Flags:
  --supabase-db-url   URL de conexão direta ao Postgres do Supabase.
                      Quando fornecida, os hashes bcrypt de senha são
                      importados e usuários não precisam resetar a senha.
  --dry-run           Simula a importação sem persistir nenhuma alteração.
  --module            Importa apenas o módulo especificado (padrão: all).
"""

import json
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction


SUPABASE_PAGE_SIZE = 1000


class Command(BaseCommand):
    help = "Importa dados do Supabase para o banco Django (migração Fase 3)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--supabase-url",
            required=True,
            help="URL do projeto Supabase (ex: https://abcdef.supabase.co)",
        )
        parser.add_argument(
            "--supabase-key",
            required=True,
            help="Service role key do Supabase (bypassa RLS)",
        )
        parser.add_argument(
            "--supabase-db-url",
            default=None,
            help="Connection string Postgres do Supabase para importar hashes de senha",
        )
        parser.add_argument(
            "--module",
            choices=["users", "profiles", "tracks", "championships", "all"],
            default="all",
            help="Módulo a importar (padrão: all)",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simula sem salvar no banco",
        )

    # ─── Entry point ──────────────────────────────────────────────────────────

    def handle(self, *args, **options):
        self.base_url = options["supabase_url"].rstrip("/")
        self.service_key = options["supabase_key"]
        self.dry_run = options["dry_run"]
        module = options["module"]

        if self.dry_run:
            self.stdout.write(self.style.WARNING("⚠  Modo dry-run: nenhuma alteração será salva.\n"))

        try:
            password_hashes: dict[str, str] = {}

            if module in ("users", "all"):
                if options["supabase_db_url"]:
                    password_hashes = self._fetch_password_hashes(options["supabase_db_url"])
                self._import_users(password_hashes)

            if module in ("profiles", "all"):
                self._import_profiles()

            if module in ("tracks", "all"):
                self._import_tracks()

            if module in ("championships", "all"):
                self._import_championships()

        except CommandError:
            raise
        except Exception as exc:
            raise CommandError(f"Erro durante a importação: {exc}") from exc

        self.stdout.write(self.style.SUCCESS("\n✓ Importação concluída."))

    # ─── HTTP helpers ──────────────────────────────────────────────────────────

    def _rest_headers(self) -> dict[str, str]:
        return {
            "apikey": self.service_key,
            "Authorization": f"Bearer {self.service_key}",
            "Accept": "application/json",
        }

    def _fetch_rest(self, path: str, params: dict | None = None) -> list[dict]:
        """Busca todos os registros de uma tabela via REST API com paginação automática."""
        results: list[dict] = []
        offset = 0

        while True:
            p: dict[str, Any] = {"select": "*", "limit": SUPABASE_PAGE_SIZE, "offset": offset}
            if params:
                p.update(params)

            url = f"{self.base_url}/rest/v1/{path}?{urllib.parse.urlencode(p)}"
            req = urllib.request.Request(url, headers=self._rest_headers())

            try:
                with urllib.request.urlopen(req) as resp:
                    page = json.loads(resp.read())
            except urllib.error.HTTPError as exc:
                raise CommandError(f"Erro ao buscar {path}: {exc.code} {exc.read().decode()}") from exc

            results.extend(page)
            if len(page) < SUPABASE_PAGE_SIZE:
                break
            offset += SUPABASE_PAGE_SIZE

        return results

    def _fetch_admin_users(self) -> list[dict]:
        """Busca usuários via Admin API (/auth/v1/admin/users)."""
        users: list[dict] = []
        page = 1

        while True:
            url = (
                f"{self.base_url}/auth/v1/admin/users"
                f"?page={page}&per_page={SUPABASE_PAGE_SIZE}"
            )
            req = urllib.request.Request(url, headers=self._rest_headers())

            try:
                with urllib.request.urlopen(req) as resp:
                    data = json.loads(resp.read())
            except urllib.error.HTTPError as exc:
                raise CommandError(
                    f"Erro na Admin API: {exc.code} {exc.read().decode()}"
                ) from exc

            batch = data.get("users", [])
            users.extend(batch)
            if len(batch) < SUPABASE_PAGE_SIZE:
                break
            page += 1

        return users

    # ─── Password hash migration ───────────────────────────────────────────────

    def _fetch_password_hashes(self, db_url: str) -> dict[str, str]:
        """
        Busca hashes bcrypt de auth.users via conexão direta ao Postgres.
        Retorna {user_id: encrypted_password}.
        """
        try:
            import psycopg2
        except ImportError as exc:
            raise CommandError("psycopg2 não instalado. Instale com: pip install psycopg2-binary") from exc

        self.stdout.write("Buscando hashes de senha via conexão Postgres...")
        hashes: dict[str, str] = {}

        try:
            conn = psycopg2.connect(db_url)
            with conn.cursor() as cur:
                cur.execute("SELECT id::text, encrypted_password FROM auth.users WHERE encrypted_password IS NOT NULL")
                for row in cur.fetchall():
                    hashes[row[0]] = row[1]
            conn.close()
        except Exception as exc:
            self.stderr.write(self.style.WARNING(f"Aviso: não foi possível buscar hashes de senha — {exc}"))
            return {}

        self.stdout.write(f"  {len(hashes)} hashes encontrados.")
        return hashes

    # ─── Importers ────────────────────────────────────────────────────────────

    @transaction.atomic
    def _import_users(self, password_hashes: dict[str, str]) -> None:
        from apps.accounts.models import User

        self.stdout.write("Importando usuários...")
        supabase_users = self._fetch_admin_users()

        created = skipped = 0
        for u in supabase_users:
            uid = u["id"]
            email = u.get("email", "")
            if not email:
                continue

            if self.dry_run:
                created += 1
                continue

            user, new = User.objects.get_or_create(id=uid, defaults={"email": email})
            if new:
                raw_hash = password_hashes.get(uid)
                if raw_hash:
                    # Armazena no formato aceito por BCryptPasswordHasher
                    user.password = "bcrypt$" + raw_hash
                else:
                    user.set_unusable_password()
                user.save(update_fields=["password"])
                created += 1
            else:
                skipped += 1

        self._report("Usuários", created, skipped)

        if not self.dry_run and password_hashes:
            no_hash = sum(1 for u in supabase_users if u["id"] not in password_hashes)
            if no_hash:
                self.stdout.write(
                    self.style.WARNING(
                        f"  ⚠  {no_hash} usuários sem hash de senha — precisarão redefinir a senha."
                    )
                )

    @transaction.atomic
    def _import_profiles(self) -> None:
        from apps.accounts.models import User
        from apps.profiles.models import Profile

        self.stdout.write("Importando perfis...")
        rows = self._fetch_rest("profiles")

        created = skipped = 0
        for row in rows:
            uid = row["id"]
            if self.dry_run:
                created += 1
                continue

            try:
                user = User.objects.get(id=uid)
            except User.DoesNotExist:
                self.stderr.write(self.style.WARNING(f"  Perfil {uid}: usuário não encontrado, pulando."))
                continue

            _, new = Profile.objects.update_or_create(
                user=user,
                defaults={
                    "username": row.get("username"),
                    "full_name": row.get("full_name"),
                    "avatar_url": row.get("avatar_url"),
                    "weight": row.get("weight"),
                    "bio": row.get("bio"),
                    "is_pro_member": row.get("is_pro_member", False),
                    "instagram": row.get("instagram"),
                    "youtube": row.get("youtube"),
                    "tiktok": row.get("tiktok"),
                    "website": row.get("website"),
                },
            )
            if new:
                created += 1
            else:
                skipped += 1

        self._report("Perfis", created, skipped)

    @transaction.atomic
    def _import_tracks(self) -> None:
        from apps.tracks.models import Track

        self.stdout.write("Importando pistas...")
        rows = self._fetch_rest("tracks")

        created = skipped = 0
        for row in rows:
            if self.dry_run:
                created += 1
                continue

            _, new = Track.objects.update_or_create(
                id=row["id"],
                defaults={
                    "name": row["name"],
                    "location": row.get("location", ""),
                    "length_meters": row.get("length_meters"),
                    "map_image_url": row.get("map_image_url"),
                },
            )
            if new:
                created += 1
            else:
                skipped += 1

        self._report("Pistas", created, skipped)

    @transaction.atomic
    def _import_championships(self) -> None:
        from apps.championships.models import Championship
        from apps.profiles.models import Profile

        self.stdout.write("Importando campeonatos...")
        rows = self._fetch_rest("championships")

        created = skipped = 0
        for row in rows:
            if self.dry_run:
                created += 1
                continue

            organizer = None
            if row.get("organizer_id"):
                try:
                    organizer = Profile.objects.get(user_id=row["organizer_id"])
                except Profile.DoesNotExist:
                    pass

            _, new = Championship.objects.update_or_create(
                id=row["id"],
                defaults={
                    "name": row["name"],
                    "rules_summary": row.get("rules_summary"),
                    "logo_url": row.get("logo_url"),
                    "is_private": row.get("is_private", False),
                    "organizer": organizer,
                },
            )
            if new:
                created += 1
            else:
                skipped += 1

        self._report("Campeonatos", created, skipped)

    # ─── Utils ────────────────────────────────────────────────────────────────

    def _report(self, label: str, created: int, skipped: int) -> None:
        verb = "seriam criados" if self.dry_run else "criados"
        self.stdout.write(
            self.style.SUCCESS(f"  ✓ {label}: {created} {verb}, {skipped} já existiam")
        )
