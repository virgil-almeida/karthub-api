-- ===========================================
-- SISTEMA DE ROLES COM EXPIRAÇÃO - CORRIGIDO
-- ===========================================

-- 1. Criar novo enum para tiers de assinatura
DO $$ BEGIN
  CREATE TYPE public.subscription_tier AS ENUM ('free', 'user', 'plus', 'moderator', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Adicionar colunas de expiração e tier na tabela user_roles
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS tier public.subscription_tier DEFAULT 'free',
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_by uuid DEFAULT NULL;

-- 3. Migrar roles existentes: admin -> tier admin
UPDATE public.user_roles 
SET tier = 'admin' 
WHERE role = 'admin' AND (tier IS NULL OR tier = 'free');

-- 4. Criar função para verificar tier do usuário (considera expiração)
CREATE OR REPLACE FUNCTION public.get_user_tier(target_user_id uuid DEFAULT auth.uid())
RETURNS public.subscription_tier
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT tier 
      FROM public.user_roles 
      WHERE user_id = target_user_id 
        AND (expires_at IS NULL OR expires_at > now())
      ORDER BY 
        CASE tier
          WHEN 'admin' THEN 5
          WHEN 'moderator' THEN 4
          WHEN 'plus' THEN 3
          WHEN 'user' THEN 2
          WHEN 'free' THEN 1
        END DESC
      LIMIT 1
    ),
    'free'::public.subscription_tier
  );
$$;

-- 5. Criar função para verificar se usuário tem tier específico ou superior
CREATE OR REPLACE FUNCTION public.has_tier_or_higher(required_tier public.subscription_tier)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE public.get_user_tier()
      WHEN 'admin' THEN 5
      WHEN 'moderator' THEN 4
      WHEN 'plus' THEN 3
      WHEN 'user' THEN 2
      WHEN 'free' THEN 1
    END >= 
    CASE required_tier
      WHEN 'admin' THEN 5
      WHEN 'moderator' THEN 4
      WHEN 'plus' THEN 3
      WHEN 'user' THEN 2
      WHEN 'free' THEN 1
    END;
$$;

-- 6. Atualizar is_admin para usar novo sistema (mantém compatibilidade)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_tier() = 'admin'::public.subscription_tier;
$$;

-- 7. Criar função para verificar se é moderador ou superior
CREATE OR REPLACE FUNCTION public.is_moderator_or_higher()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_tier_or_higher('moderator'::public.subscription_tier);
$$;

-- 8. Criar função para verificar se é plus ou superior (pode criar campeonatos)
CREATE OR REPLACE FUNCTION public.can_create_championships()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_tier_or_higher('plus'::public.subscription_tier);
$$;

-- 9. Criar função para verificar se pode ver Analytics
CREATE OR REPLACE FUNCTION public.can_view_analytics()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_tier_or_higher('user'::public.subscription_tier);
$$;

-- 10. Garantir que todos os usuários tenham pelo menos tier free
-- Para usuários sem role, criar entrada com tier free (usando 'pilot' como app_role)
INSERT INTO public.user_roles (user_id, role, tier)
SELECT p.id, 'pilot'::public.app_role, 'free'::public.subscription_tier
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id
)
ON CONFLICT DO NOTHING;

-- 11. Atualizar trigger para criar role free para novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role, tier)
  VALUES (NEW.id, 'pilot', 'free')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- Dropar trigger existente se houver
DROP TRIGGER IF EXISTS on_profile_created_add_role ON public.profiles;

-- Criar trigger para adicionar role free quando profile é criado
CREATE TRIGGER on_profile_created_add_role
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- 12. Atualizar RLS para user_roles - permitir admin e moderator gerenciar
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;

CREATE POLICY "Admins and moderators can manage roles"
ON public.user_roles
FOR ALL
USING (is_moderator_or_higher())
WITH CHECK (is_moderator_or_higher());

-- 13. Atualizar política de criação de campeonatos
DROP POLICY IF EXISTS "Authenticated users can create championships" ON public.championships;

CREATE POLICY "Plus users and above can create championships"
ON public.championships
FOR INSERT
WITH CHECK (can_create_championships() AND organizer_id = auth.uid());