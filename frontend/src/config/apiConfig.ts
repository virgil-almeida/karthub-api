/**
 * Feature flags para migração gradual Supabase → Django.
 *
 * Setar um módulo para `true` faz os hooks daquele módulo
 * baterem na API Django em vez do Supabase.
 *
 * ATENÇÃO: só ative um módulo quando o fluxo de autenticação
 * Django estiver funcional para aquele ambiente.
 */
export const USE_DJANGO_API = {
  auth: false,
  tracks: false,
  profiles: false,
  championships: false,
  events: false,
  races: false,
  badges: false,
  analytics: false,
  admin: false,
} as const;

export type ApiModule = keyof typeof USE_DJANGO_API;

export const DJANGO_API_URL =
  (import.meta.env.VITE_DJANGO_API_URL as string | undefined) ??
  "http://localhost:8000/api/v1";
