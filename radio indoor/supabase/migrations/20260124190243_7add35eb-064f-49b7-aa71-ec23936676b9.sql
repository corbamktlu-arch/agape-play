
-- Add account status to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_status text NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended'));

-- Add suspended_reason to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS suspended_reason text;

-- Add suspended_at to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS suspended_at timestamp with time zone;

-- Add created_by to profiles (to track who created this user)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Add manager_id to stores (to assign stores to managers)
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES auth.users(id);

-- Create announcement_frequency enum
DO $$ BEGIN
  CREATE TYPE announcement_frequency AS ENUM ('15min', '30min', '1hour');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add frequency settings to announcement_schedules
ALTER TABLE public.announcement_schedules 
ADD COLUMN IF NOT EXISTS frequency announcement_frequency DEFAULT '30min';

ALTER TABLE public.announcement_schedules 
ADD COLUMN IF NOT EXISTS start_time time without time zone DEFAULT '08:00:00';

ALTER TABLE public.announcement_schedules 
ADD COLUMN IF NOT EXISTS end_time time without time zone DEFAULT '22:00:00';

-- Create user_store_assignments table for manager-store relationships
CREATE TABLE IF NOT EXISTS public.user_store_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, store_id)
);

-- Enable RLS on user_store_assignments
ALTER TABLE public.user_store_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_store_assignments
CREATE POLICY "Admins can manage user_store_assignments" 
ON public.user_store_assignments 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Managers can view their assignments" 
ON public.user_store_assignments 
FOR SELECT 
USING (user_id = auth.uid());

-- Update profiles RLS to allow admins to manage all profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile or admins can view all" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile or admins can update all" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins and managers can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'manager'));

-- Function to check if user account is active
CREATE OR REPLACE FUNCTION public.is_account_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT account_status = 'active' FROM public.profiles WHERE user_id = _user_id),
    true
  )
$$;

-- Function to get user's assigned stores
CREATE OR REPLACE FUNCTION public.get_user_stores(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT store_id FROM public.user_store_assignments WHERE user_id = _user_id
$$;
