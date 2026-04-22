# Plano de Migração — Supabase → Django REST API

Este documento descreve como migrar o backend do KartHub de Supabase (PostgreSQL + Auth gerenciado) para um backend próprio em Python/Django, **sem quebrar o frontend durante a transição**.

---

## Visão Geral da Estratégia

A migração segue a abordagem **Strangler Fig**: o Django vai assumindo responsabilidades do Supabase progressivamente, módulo a módulo. O frontend nunca fica fora do ar — ele aponta para o Supabase durante toda a fase 1, passa a usar o Django para novos módulos na fase 2, e completa a transição na fase 3.

```
Fase 1 → Infraestrutura Django pronta, sem tráfego real
Fase 2 → Módulos migrados um a um (feature flag por módulo)
Fase 3 → Supabase Auth substituído, migração de dados, corte final
```

---

## Fase 1 — Infraestrutura Base Django

**Objetivo:** criar o projeto Django com toda a configuração necessária, sem alterar o frontend.

### 1.1 Setup do Projeto

```bash
# Estrutura de diretórios
karthub-api/
├── backend/
│   ├── manage.py
│   ├── config/
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── apps/
│   │   ├── accounts/     # User, UserRole
│   │   ├── profiles/     # Profile
│   │   ├── championships/
│   │   ├── events/       # Event, Heat, HeatResult, LapTelemetry
│   │   ├── tracks/
│   │   ├── races/        # StandaloneRace, StandaloneRaceTelemetry
│   │   ├── badges/
│   │   └── admin_panel/  # FeatureVisibility
│   └── requirements/
│       ├── base.txt
│       ├── development.txt
│       └── production.txt
├── frontend/             # sem alterações
└── docs/
```

### 1.2 Dependências Principais

```txt
# requirements/base.txt
Django==5.1.*
djangorestframework==3.15.*
djangorestframework-simplejwt==5.*
django-cors-headers==4.*
django-storages[s3]==1.14.*
Pillow==10.*
psycopg2-binary==2.9.*
python-decouple==3.*
dj-rest-auth==6.*            # login/registro/logout padronizado
django-filter==24.*          # filtros em list views
```

### 1.3 Modelo de Autenticação

Usar `AbstractUser` customizado (campo `id` como UUID, remover `username` como login):

```python
# apps/accounts/models.py
import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    username = None  # login é por email

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
```

### 1.4 Sistema de Tiers

```python
# apps/accounts/models.py
class SubscriptionTier(models.TextChoices):
    FREE = "free"
    USER = "user"
    PLUS = "plus"
    MODERATOR = "moderator"
    ADMIN = "admin"

TIER_PRIORITY = {
    SubscriptionTier.FREE: 1,
    SubscriptionTier.USER: 2,
    SubscriptionTier.PLUS: 3,
    SubscriptionTier.MODERATOR: 4,
    SubscriptionTier.ADMIN: 5,
}

class UserRole(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="role")
    tier = models.CharField(max_length=20, choices=SubscriptionTier.choices, default=SubscriptionTier.FREE)
    expires_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="+")

    @property
    def effective_tier(self):
        from django.utils import timezone
        if self.expires_at and self.expires_at < timezone.now():
            return SubscriptionTier.FREE
        return self.tier

    def has_tier_or_higher(self, required: str) -> bool:
        return TIER_PRIORITY[self.effective_tier] >= TIER_PRIORITY[required]
```

### 1.5 Permission Classes Customizadas

```python
# apps/accounts/permissions.py
from rest_framework.permissions import BasePermission

class IsPlusTierOrHigher(BasePermission):
    def has_permission(self, request, view):
        return request.user.role.has_tier_or_higher("plus")

class IsModeratorOrHigher(BasePermission):
    def has_permission(self, request, view):
        return request.user.role.has_tier_or_higher("moderator")

class IsAdminTier(BasePermission):
    def has_permission(self, request, view):
        return request.user.role.effective_tier == "admin"
```

### 1.6 Banco de Dados

- **Desenvolvimento:** PostgreSQL local (Docker Compose)
- **Produção:** manter o mesmo banco Supabase (conexão direta via `DATABASE_URL`) até fase 3

```yaml
# docker-compose.yml (desenvolvimento)
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: karthub
      POSTGRES_USER: karthub
      POSTGRES_PASSWORD: karthub
    ports:
      - "5432:5432"

  api:
    build: ./backend
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    depends_on:
      - db
    env_file: .env
```

### 1.7 Configurações CORS

```python
# config/settings/base.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8080",   # frontend dev
]
CORS_ALLOW_CREDENTIALS = True
```

**Entregáveis da Fase 1:**
- [ ] Projeto Django criado com todas as apps
- [ ] Todos os modelos definidos e migrations rodando
- [ ] Autenticação JWT funcionando (login/register/refresh)
- [ ] Docker Compose para desenvolvimento
- [ ] CI com linting (ruff) e testes básicos

---

## Fase 2 — Migração Módulo a Módulo

**Objetivo:** migrar cada área funcional para Django enquanto o frontend ainda usa Supabase para as demais. Usa feature flag no frontend para redirecionar chamadas.

### Estratégia de Feature Flag no Frontend

Criar um arquivo de configuração central:

```typescript
// frontend/src/config/apiConfig.ts
export const USE_DJANGO_API = {
  auth: false,
  tracks: false,
  championships: false,
  events: false,
  // ...
};

export const DJANGO_API_URL = import.meta.env.VITE_DJANGO_API_URL ?? "http://localhost:8000/api/v1";
```

Cada hook recebe uma variante que usa a REST API Django em vez do Supabase:

```typescript
// Exemplo: hooks/useTracksApi.ts (versão Django)
export function useTracks() {
  return useQuery({
    queryKey: ["tracks"],
    queryFn: async () => {
      if (USE_DJANGO_API.tracks) {
        const res = await fetch(`${DJANGO_API_URL}/tracks/`, { headers: authHeaders() });
        return res.json();
      }
      // fallback Supabase
      const { data } = await supabase.from("tracks").select("*").order("name");
      return data;
    },
  });
}
```

### Ordem de Migração Recomendada

A ordem é do módulo menos dependente para o mais dependente:

#### 2.1 Tracks (sem dependências)
- Implementar `GET/POST/PATCH/DELETE /api/v1/tracks/`
- Testar com frontend usando flag `USE_DJANGO_API.tracks = true`
- Validar contra dados de produção do Supabase

#### 2.2 Profiles (depende só de Auth)
- Implementar CRUD de perfis
- Implementar lógica de visibilidade de `weight`
- Implementar upload de avatar (S3/MinIO)
- Validar que dados existentes do Supabase são compatíveis

#### 2.3 Championships + Members
- Implementar CRUD de campeonatos
- Implementar lógica de privacidade
- Implementar CRUD de membros com regras de status
- Upload de logo de campeonato

#### 2.4 Tracks → Events → Heats → Heat Results
- Migrar em cadeia, testando cada nível antes do próximo
- Endpoint de bulk import (CSV) é crítico para organizadores

#### 2.5 Telemetria (Lap Telemetry + Standalone)
- Migrar após Heat Results estar estável
- Implementar endpoints de Standalone Races e sua telemetria

#### 2.6 Badges
- Migrar definições e atribuições
- Implementar upload de imagem de badge

#### 2.7 Analytics
- Implementar os 4 endpoints de analytics com queries otimizadas
- Usar Django ORM com `annotate`/`aggregate` ou SQL raw para queries complexas
- Adicionar cache com Redis para head-to-head e classificação geral

#### 2.8 Admin Panel (Roles + Feature Visibility)
- Migrar gestão de tiers
- Migrar feature visibility

**Entregáveis da Fase 2:**
- [ ] Todos os 76 endpoints implementados e testados
- [ ] Cobertura de testes ≥ 80% nas views e models
- [ ] Documentação de API gerada (drf-spectacular → OpenAPI/Swagger)
- [ ] Feature flags no frontend cobrindo 100% das chamadas

---

## Fase 3 — Substituição do Supabase Auth e Corte Final

**Objetivo:** remover a dependência do Supabase completamente.

### 3.1 Migração dos Dados

Exportar dados do Supabase e importar no banco Django:

```python
# scripts/migrate_from_supabase.py
# 1. Exportar users de auth.users → criar User + Profile no Django
# 2. Exportar todas as tabelas na ordem correta de dependência:
#    user_roles → profiles → tracks → championships → championship_members
#    → events → heats → heat_results → lap_telemetry
#    → standalone_races → standalone_race_telemetry
#    → badge_definitions → driver_badges → feature_visibility
```

**Ordem crítica de importação** (respeitando FKs):
1. `User` (sem FK para dados do app)
2. `UserRole`, `Profile`
3. `Track`
4. `Championship`
5. `ChampionshipMember`
6. `Event`
7. `Heat`
8. `HeatResult`
9. `LapTelemetry`
10. `StandaloneRace`
11. `StandaloneRaceTelemetry`
12. `BadgeDefinition`
13. `DriverBadge`
14. `FeatureVisibility`

**Estratégia para UUIDs:** preservar os mesmos UUIDs do Supabase — isso evita links quebrados e permite rollback simples.

### 3.2 Migração de Storage

Mover arquivos dos buckets Supabase para S3 (ou outro provider):

```bash
# Buckets a migrar:
# - avatars/        → s3://karthub/avatars/
# - championship-logos/ → s3://karthub/championship-logos/
# - badge-images/   → s3://karthub/badge-images/
```

### 3.3 Migração de Senhas

O Supabase usa bcrypt para senhas. Django também suporta bcrypt:

```python
# Instalar bcrypt no Django:
# pip install bcrypt
# settings.py:
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.BCryptSHA256PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",  # fallback
]
```

Exportar os hashes de senha do Supabase (via `auth.users.encrypted_password`) e importar diretamente no campo `password` do Django User — **usuários não precisam redefinir suas senhas**.

### 3.4 Atualização do Frontend

Quando Django estiver 100% pronto:

1. Remover `@supabase/supabase-js` do `package.json`
2. Remover `src/integrations/supabase/`
3. Substituir `AuthContext` por implementação com JWT Django
4. Remover todas as feature flags (todos os hooks apontam para Django)
5. Atualizar variáveis de ambiente:

```env
# .env (após corte)
VITE_API_URL=https://api.karthub.com.br/api/v1
# remover VITE_SUPABASE_*
```

### 3.5 Corte Final

**Checklist antes do go-live:**

- [ ] Dry-run da migração de dados em ambiente de staging
- [ ] Todos os testes E2E do frontend passando contra API Django
- [ ] Monitoramento/logs configurados (Sentry, structlog)
- [ ] Backup completo do banco Supabase antes do corte
- [ ] DNS/deploy configurado
- [ ] Plano de rollback documentado (reverter `VITE_API_URL` para Supabase)

**Janela de manutenção sugerida:** 2–4 horas em horário de baixo uso.

---

## Estrutura de Testes

```
backend/
└── apps/
    ├── accounts/
    │   └── tests/
    │       ├── test_models.py      # lógica de tier, expiração
    │       ├── test_auth.py        # login, registro, refresh
    │       └── test_permissions.py # classes de permissão
    ├── championships/
    │   └── tests/
    │       ├── test_views.py       # CRUD, privacidade
    │       └── test_members.py     # status, roles
    └── events/
        └── tests/
            ├── test_heat_results.py  # visibilidade payment_status
            └── test_analytics.py    # queries complexas
```

Usar `pytest-django` + `factory_boy` para fixtures. Banco de testes em memória (SQLite) para testes unitários, PostgreSQL para testes de integração.

---

## Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Incompatibilidade de hashes de senha | Baixa | bcrypt é compatível; fallback PBKDF2 para casos edge |
| UUIDs conflitantes na importação | Média | Preservar UUIDs originais do Supabase |
| Queries de analytics lentas | Alta | Implementar com `select_related` + cache Redis; índices no banco |
| Quebra de sessão dos usuários | Média | Janela de manutenção; comunicar antecipadamente |
| Storage URLs quebradas após migração | Média | Redirect 301 das URLs antigas do Supabase |
| Realtime (se usado no futuro) | Baixa | Django Channels + WebSocket como alternativa |

---

## Stack Tecnológica Final (Backend Django)

| Componente | Tecnologia |
|---|---|
| Framework | Django 5.1 + DRF 3.15 |
| Autenticação | `djangorestframework-simplejwt` |
| Banco de dados | PostgreSQL 16 |
| Storage | `django-storages` + AWS S3 (ou MinIO) |
| Cache | Redis (Django cache framework) |
| Documentação API | `drf-spectacular` (OpenAPI 3) |
| Testes | `pytest-django` + `factory_boy` |
| Linting | `ruff` |
| Deploy | Docker + Gunicorn + Nginx |
