# Serviços Necessários — KartHub API (Django)

Levantamento completo das operações que o frontend realiza via Supabase e que precisam ser reproduzidas como endpoints REST em um backend Django.

Convenções adotadas:
- Todos os endpoints são prefixados com `/api/v1/`
- Autenticação via JWT no header `Authorization: Bearer <token>`
- Permissões: `público` = sem auth; `autenticado` = qualquer usuário logado; `dono` = somente o próprio usuário; `organizador` = organizador do campeonato; `moderador+` = tier moderator ou superior; `admin` = tier admin

---

## 1. Autenticação

> Inicialmente pode ser delegada ao Supabase Auth. Na migração completa, implementar com `djangorestframework-simplejwt` + `dj-rest-auth`.

| Operação | Endpoint sugerido | Permissão |
|---|---|---|
| Login com email/senha | `POST /api/v1/auth/login/` | público |
| Cadastro | `POST /api/v1/auth/register/` | público |
| Logout | `POST /api/v1/auth/logout/` | autenticado |
| Refresh de token | `POST /api/v1/auth/token/refresh/` | público |
| Dados do usuário atual | `GET /api/v1/auth/me/` | autenticado |

**Observações:**
- Ao registrar, criar automaticamente um `Profile` e um `UserRole` com tier `free` (equivalente ao trigger `handle_new_user` + `handle_new_user_role`).
- O endpoint `/me/` deve retornar o perfil completo, tier, flags `is_admin`, `can_view_analytics`, `can_create_championships`.

---

## 2. Perfis (Profiles)

| Operação | Endpoint | Método | Permissão |
|---|---|---|---|
| Listar todos os perfis | `/api/v1/profiles/` | GET | autenticado |
| Obter perfil por ID | `/api/v1/profiles/{id}/` | GET | autenticado |
| Atualizar próprio perfil | `/api/v1/profiles/{id}/` | PATCH | dono \| admin |
| Verificar se pode ver peso | `/api/v1/profiles/{id}/can-view-weight/` | GET | autenticado |
| Garantir que perfil existe | `/api/v1/profiles/ensure/` | POST | autenticado |

**Campos do modelo `Profile`:**

```
id (UUID, FK → User)
username (str, único, 3–50 chars)
full_name (str, máx 255)
avatar_url (str, máx 500, URL válida)
weight (decimal, 0–500 kg, visível só para: dono, admin, organizador do campeonato)
bio (str, máx 5000)
is_pro_member (bool)
instagram, youtube, tiktok, website (str)
created_at, updated_at
```

**Regras de visibilidade:**
- `weight` só é retornado se o usuário solicitante for: dono, admin, ou organizador de um campeonato do qual o piloto é membro.
- Listagem pública retorna campos básicos (`id`, `username`, `full_name`, `avatar_url`).

---

## 3. Upload de Arquivos (Storage)

| Operação | Endpoint | Método | Permissão |
|---|---|---|---|
| Upload de avatar | `/api/v1/profiles/{id}/avatar/` | POST | dono |
| Upload de logo de campeonato | `/api/v1/championships/{id}/logo/` | POST | organizador \| admin |
| Upload de imagem de badge | `/api/v1/badges/definitions/{id}/image/` | POST | moderador+ |

**Observações:**
- Usar `django-storages` com S3 (ou MinIO local) como backend.
- Retornar a URL pública do arquivo após upload.
- Limites: avatars = 2 MB (JPEG, PNG, WebP); logos e badges = sem limite definido nas migrations.
- Ao fazer upload de novo avatar, remover o arquivo anterior do storage.

---

## 4. Campeonatos (Championships)

| Operação | Endpoint | Método | Permissão |
|---|---|---|---|
| Listar campeonatos | `/api/v1/championships/` | GET | autenticado (privados só visíveis ao organizador/membros) |
| Obter campeonato por ID | `/api/v1/championships/{id}/` | GET | autenticado |
| Criar campeonato | `/api/v1/championships/` | POST | plus+ |
| Atualizar campeonato | `/api/v1/championships/{id}/` | PATCH | organizador \| admin |
| Deletar campeonato | `/api/v1/championships/{id}/` | DELETE | organizador \| admin |
| Meus campeonatos | `/api/v1/championships/mine/` | GET | autenticado |

**Campos do modelo `Championship`:**

```
id (UUID)
name (str, 1–200 chars)
organizer (FK → Profile)
rules_summary (str, máx 10000)
is_private (bool)
logo_url (str, máx 500)
created_at, updated_at
```

**Serialização:** incluir objeto `organizer` aninhado com `id`, `username`, `full_name`, `avatar_url`.

---

## 5. Membros de Campeonato (Championship Members)

| Operação | Endpoint | Método | Permissão |
|---|---|---|---|
| Listar membros do campeonato | `/api/v1/championships/{id}/members/` | GET | autenticado (respeita privacidade) |
| Entrar no campeonato | `/api/v1/championships/{id}/members/` | POST | autenticado |
| Atualizar status do membro | `/api/v1/championships/{id}/members/{member_id}/` | PATCH | organizador \| admin |
| Remover membro | `/api/v1/championships/{id}/members/{member_id}/` | DELETE | organizador \| admin |

**Campos do modelo `ChampionshipMember`:**

```
id (UUID)
championship (FK → Championship)
profile (FK → Profile)
status (enum: active, pending, banned)
role (enum: driver, admin, organizer)
joined_at (datetime)
```

**Regras de visibilidade:**
- Campeonatos públicos: qualquer usuário autenticado vê os membros.
- Campeonatos privados: somente membros, organizador ou admin.

---

## 6. Etapas (Events)

| Operação | Endpoint | Método | Permissão |
|---|---|---|---|
| Listar etapas | `/api/v1/events/` | GET | autenticado |
| Filtrar por campeonato | `/api/v1/championships/{id}/events/` | GET | autenticado |
| Obter etapa por ID | `/api/v1/events/{id}/` | GET | autenticado |
| Criar etapa | `/api/v1/events/` | POST | organizador \| admin |
| Atualizar etapa | `/api/v1/events/{id}/` | PATCH | organizador \| admin |
| Deletar etapa | `/api/v1/events/{id}/` | DELETE | organizador \| admin |

**Campos do modelo `Event`:**

```
id (UUID)
championship (FK → Championship)
track (FK → Track, nullable)
name (str, 1–200)
date (date)
status (enum: scheduled, in_progress, completed, cancelled)
created_at
```

**Serialização:** incluir `track` aninhado (`id`, `name`, `location`, `length_meters`, `map_image_url`) e `championship` aninhado (`id`, `name`).

---

## 7. Baterias (Heats)

| Operação | Endpoint | Método | Permissão |
|---|---|---|---|
| Listar baterias da etapa | `/api/v1/events/{id}/heats/` | GET | autenticado |
| Obter bateria por ID | `/api/v1/heats/{id}/` | GET | autenticado |
| Criar bateria | `/api/v1/events/{id}/heats/` | POST | organizador \| admin |
| Atualizar bateria | `/api/v1/heats/{id}/` | PATCH | organizador \| admin |
| Deletar bateria | `/api/v1/heats/{id}/` | DELETE | organizador \| admin |

**Campos do modelo `Heat`:**

```
id (UUID)
event (FK → Event)
name (str, 1–200)
weather_condition (enum: dry, wet, mixed)
start_time (datetime, nullable)
created_at
```

---

## 8. Resultados de Bateria (Heat Results)

| Operação | Endpoint | Método | Permissão |
|---|---|---|---|
| Listar resultados da bateria (view pública) | `/api/v1/heats/{id}/results/` | GET | autenticado |
| Obter resultado por ID | `/api/v1/heat-results/{id}/` | GET | autenticado |
| Criar resultado | `/api/v1/heats/{id}/results/` | POST | organizador \| admin |
| Importar resultados em lote (CSV) | `/api/v1/heats/{id}/results/bulk/` | POST | organizador \| admin |
| Atualizar resultado | `/api/v1/heat-results/{id}/` | PATCH | organizador \| admin |
| Atualizar status de pagamento | `/api/v1/heat-results/{id}/payment/` | PATCH | organizador \| admin |
| Deletar resultado | `/api/v1/heat-results/{id}/` | DELETE | organizador \| admin |

**Campos do modelo `HeatResult`:**

```
id (UUID)
heat (FK → Heat)
driver (FK → Profile, nullable — piloto pode ser não cadastrado)
driver_name_text (str — nome livre quando piloto não tem conta)
position (int > 0)
kart_number (int 1–999, nullable)
best_lap_time (str, ex: "1:02.345")
total_time (str)
gap_to_leader, gap_to_previous (str)
average_speed (decimal)
total_laps (int)
payment_status (bool — visível só para: admin, dono, organizador)
points (int >= 0)
created_at
```

**View pública:** retornar todos os campos **exceto** `payment_status` para usuários não autorizados (equivalente à view `heat_results_public`).

---

## 9. Telemetria de Baterias (Lap Telemetry)

| Operação | Endpoint | Método | Permissão |
|---|---|---|---|
| Listar voltas do resultado | `/api/v1/heat-results/{id}/telemetry/` | GET | autenticado |
| Criar registro de volta | `/api/v1/heat-results/{id}/telemetry/` | POST | organizador \| admin \| dono do resultado |
| Atualizar registro de volta | `/api/v1/telemetry/{id}/` | PATCH | organizador \| admin |
| Deletar registro de volta | `/api/v1/telemetry/{id}/` | DELETE | organizador \| admin |

**Campos do modelo `LapTelemetry`:**

```
id (UUID)
heat_result (FK → HeatResult)
lap_number (int)
lap_time (str)
sector1, sector2, sector3 (str, nullable)
kart_number (int, nullable)
gap_to_best, gap_to_leader (str, nullable)
total_time (str, nullable)
average_speed (decimal, nullable)
created_at
```

---

## 10. Pistas (Tracks)

| Operação | Endpoint | Método | Permissão |
|---|---|---|---|
| Listar pistas | `/api/v1/tracks/` | GET | autenticado |
| Obter pista por ID | `/api/v1/tracks/{id}/` | GET | autenticado |
| Criar pista | `/api/v1/tracks/` | POST | admin |
| Atualizar pista | `/api/v1/tracks/{id}/` | PATCH | admin |
| Deletar pista | `/api/v1/tracks/{id}/` | DELETE | admin |

**Campos do modelo `Track`:**

```
id (UUID)
name (str, 1–200)
location (str, 1–500)
length_meters (int > 0, nullable)
map_image_url (str, nullable)
created_at
```

---

## 11. Corridas Avulsas / Treinos (Standalone Races)

> Corridas fora de campeonato, vinculadas diretamente ao usuário.

| Operação | Endpoint | Método | Permissão |
|---|---|---|---|
| Listar minhas corridas | `/api/v1/standalone-races/` | GET | dono |
| Filtrar por tipo (training/standalone) | `/api/v1/standalone-races/?type=training` | GET | dono |
| Criar corrida avulsa | `/api/v1/standalone-races/` | POST | autenticado |
| Deletar corrida avulsa | `/api/v1/standalone-races/{id}/` | DELETE | dono |

**Campos do modelo `StandaloneRace`:**

```
id (UUID)
user (FK → User)
race_type (enum: training, standalone)
track_name (str, nullable)
date (date)
position (int, nullable)
kart_number (int, nullable)
total_laps (int, nullable)
best_lap_time (str, nullable)
total_time (str, nullable)
average_speed (decimal, nullable)
gap_to_leader (str, nullable)
points (int, default 0)
notes (str, nullable)
created_at, updated_at
```

---

## 12. Telemetria de Corridas Avulsas (Standalone Race Telemetry)

| Operação | Endpoint | Método | Permissão |
|---|---|---|---|
| Listar voltas da corrida | `/api/v1/standalone-races/{id}/telemetry/` | GET | dono |
| Criar registro de volta | `/api/v1/standalone-races/{id}/telemetry/` | POST | dono |
| Atualizar registro de volta | `/api/v1/standalone-race-telemetry/{id}/` | PATCH | dono |
| Deletar registro de volta | `/api/v1/standalone-race-telemetry/{id}/` | DELETE | dono |

**Campos do modelo `StandaloneRaceTelemetry`:**

```
id (UUID)
standalone_race (FK → StandaloneRace)
lap_number (int)
lap_time (str)
kart_number (int, nullable)
gap_to_best, gap_to_leader (str, nullable)
total_time (str, nullable)
average_speed (decimal, nullable)
sector1, sector2, sector3 (str, nullable)
created_at
```

---

## 13. Badges / Conquistas

### 13.1 Definições de Badges

| Operação | Endpoint | Método | Permissão |
|---|---|---|---|
| Listar definições | `/api/v1/badges/definitions/` | GET | autenticado |
| Criar definição | `/api/v1/badges/definitions/` | POST | moderador+ |
| Atualizar definição | `/api/v1/badges/definitions/{id}/` | PATCH | moderador+ |
| Deletar definição | `/api/v1/badges/definitions/{id}/` | DELETE | moderador+ |

**Campos do modelo `BadgeDefinition`:**

```
id (UUID)
name (str)
description (str, nullable)
icon_name (str)
color (str)
is_automatic (bool)
auto_condition (str, nullable)
championship (FK → Championship, nullable)
created_by (FK → Profile, nullable)
show_preview (bool, default true)
custom_image_url (str, nullable)
created_at, updated_at
```

### 13.2 Badges Atribuídos (Driver Badges)

| Operação | Endpoint | Método | Permissão |
|---|---|---|---|
| Listar badges atribuídos (todos) | `/api/v1/badges/assigned/` | GET | moderador+ |
| Listar badges de um piloto | `/api/v1/profiles/{id}/badges/` | GET | autenticado |
| Atribuir badge a piloto | `/api/v1/badges/assigned/` | POST | moderador+ |
| Remover badge de piloto | `/api/v1/badges/assigned/{id}/` | DELETE | moderador+ |

**Campos do modelo `DriverBadge`:**

```
id (UUID)
profile (FK → Profile)
badge_definition (FK → BadgeDefinition, nullable)
badge_type (str)
badge_name (str)
championship (FK → Championship, nullable)
awarded_by (FK → Profile, nullable)
notes (str, nullable)
earned_at (datetime)
```

---

## 14. Classificação Geral (Standings / Leaderboard)

> Consulta agregada — pode ser implementada como endpoint calculado ou view materializada.

| Operação | Endpoint | Método | Permissão |
|---|---|---|---|
| Classificação geral | `/api/v1/standings/` | GET | autenticado |
| Classificação por campeonato | `/api/v1/championships/{id}/standings/` | GET | autenticado |

**Resposta esperada:** lista de pilotos com `profile` (básico), `stats` (totalRaces, wins, podiums, bestPosition, averagePosition, totalPoints, fastestLaps) e `badges`.

---

## 15. Analytics

> Todos os endpoints abaixo exigem tier `user` ou superior (`can_view_analytics`).

| Operação | Endpoint | Método | Permissão |
|---|---|---|---|
| Lista de corridas do usuário (com contexto) | `/api/v1/analytics/races/` | GET | user+ |
| Evolução de melhor volta por pista | `/api/v1/analytics/lap-evolution/` | GET | user+ |
| Comparação por pista | `/api/v1/analytics/track-comparison/` | GET | user+ |
| Head-to-head entre dois pilotos | `/api/v1/analytics/head-to-head/?driver1={id}&driver2={id}` | GET | user+ |

**Observações:** estes endpoints realizam joins complexos entre `heat_results`, `heats`, `events`, `tracks`, `lap_telemetry` e `standalone_races`. Devem ser implementados com `select_related`/`prefetch_related` no Django ORM ou como queries SQL otimizadas, pois são as operações mais custosas do sistema.

---

## 16. Roles e Permissões de Usuários

| Operação | Endpoint | Método | Permissão |
|---|---|---|---|
| Listar todos os usuários com roles | `/api/v1/admin/users/` | GET | moderador+ |
| Obter tier do usuário atual | `/api/v1/auth/me/` (incluso no payload) | GET | autenticado |
| Atualizar tier de usuário | `/api/v1/admin/users/{id}/tier/` | PATCH | moderador+ |
| Resetar tier para free | `/api/v1/admin/users/{id}/tier/` | DELETE | moderador+ |

**Campos do modelo `UserRole`:**

```
id (UUID)
user (FK → User, único)
role (enum: admin, pilot)
tier (enum: free, user, plus, moderator, admin)
expires_at (datetime, nullable — tier expira automaticamente)
updated_at
updated_by (FK → User, nullable)
```

**Hierarquia de tiers:** `free(1) < user(2) < plus(3) < moderator(4) < admin(5)`

---

## 17. Visibilidade de Features (Feature Visibility)

| Operação | Endpoint | Método | Permissão |
|---|---|---|---|
| Listar regras de visibilidade | `/api/v1/admin/feature-visibility/` | GET | público |
| Atualizar regra | `/api/v1/admin/feature-visibility/{id}/` | PATCH | admin |

**Campos do modelo `FeatureVisibility`:**

```
id (UUID)
feature_key (str, único)
min_tier (enum: subscription_tier)
label (str)
created_at
```

**Chaves de feature cadastradas:**
- `profile_standalone_races` — tier mínimo: free
- `profile_badges` — tier mínimo: free
- `profile_social_links` — tier mínimo: free
- `profile_stats` — tier mínimo: free
- `profile_website` — tier mínimo: plus

---

## Resumo de Modelos Django

| App Django sugerida | Modelos |
|---|---|
| `accounts` | `User` (custom, extend AbstractUser), `UserRole` |
| `profiles` | `Profile` |
| `championships` | `Championship`, `ChampionshipMember` |
| `events` | `Event`, `Heat`, `HeatResult`, `LapTelemetry` |
| `tracks` | `Track` |
| `races` | `StandaloneRace`, `StandaloneRaceTelemetry` |
| `badges` | `BadgeDefinition`, `DriverBadge` |
| `admin_panel` | `FeatureVisibility` |

## Resumo de Endpoints

| Área | Endpoints |
|---|---|
| Auth | 5 |
| Profiles + Storage | 6 |
| Championships | 6 |
| Championship Members | 4 |
| Events | 6 |
| Heats | 5 |
| Heat Results | 7 |
| Lap Telemetry | 4 |
| Tracks | 5 |
| Standalone Races | 4 |
| Standalone Telemetry | 4 |
| Badges | 8 |
| Standings | 2 |
| Analytics | 4 |
| User Roles (admin) | 4 |
| Feature Visibility | 2 |
| **Total** | **76** |
