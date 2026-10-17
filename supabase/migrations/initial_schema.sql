CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  phone TEXT,
  subscription_tier TEXT DEFAULT 'starter',
  subscription_status TEXT DEFAULT 'trial',
  onboarding_completed BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'member';

CREATE TABLE IF NOT EXISTS public.ava_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ava_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES ava_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ava_memory_store (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  memory_type TEXT CHECK (memory_type IN ('brand', 'preference', 'conversation', 'project')),
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  importance_score INTEGER DEFAULT 5,
  last_accessed TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, memory_type, key)
);

CREATE TABLE IF NOT EXISTS public.ava_brand_context (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  brand_name TEXT,
  brand_voice TEXT,
  brand_values TEXT[],
  target_audience TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ava_voice_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  call_sid TEXT UNIQUE,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  phone_number TEXT,
  duration_seconds INTEGER,
  recording_url TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ava_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ava_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ava_memory_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ava_brand_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ava_voice_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_owner());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_owner());

DROP POLICY IF EXISTS "Users can view own conversations" ON public.ava_conversations;
CREATE POLICY "Users can view own conversations"
  ON public.ava_conversations FOR SELECT
  USING (auth.uid() = user_id OR public.is_owner());

DROP POLICY IF EXISTS "Users can view own messages" ON public.ava_messages;
CREATE POLICY "Users can view own messages"
  ON public.ava_messages FOR SELECT
  USING (auth.uid() = user_id OR public.is_owner());

DROP POLICY IF EXISTS "Users can insert own messages" ON public.ava_messages;
CREATE POLICY "Users can insert own messages"
  ON public.ava_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id OR public.is_owner());

CREATE INDEX IF NOT EXISTS idx_ava_messages_conversation ON public.ava_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ava_messages_user ON public.ava_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_memory_user ON public.ava_memory_store(user_id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
