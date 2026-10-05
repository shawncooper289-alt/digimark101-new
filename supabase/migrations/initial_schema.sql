-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  phone TEXT,
  subscription_tier TEXT DEFAULT 'starter',
  subscription_status TEXT DEFAULT 'trial',
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ava conversations
CREATE TABLE ava_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ava messages
CREATE TABLE ava_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES ava_conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ava memory store
CREATE TABLE ava_memory_store (
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

-- Brand context
CREATE TABLE ava_brand_context (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  brand_name TEXT,
  brand_voice TEXT,
  brand_values TEXT[],
  target_audience TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voice calls
CREATE TABLE ava_voice_calls (
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

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ava_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ava_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ava_memory_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE ava_brand_context ENABLE ROW LEVEL SECURITY;
ALTER TABLE ava_voice_calls ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can view own conversations"
  ON ava_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages"
  ON ava_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages"
  ON ava_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_ava_messages_conversation ON ava_messages(conversation_id);
CREATE INDEX idx_ava_messages_user ON ava_messages(user_id);
CREATE INDEX idx_memory_user ON ava_memory_store(user_id);

-- Function to handle new user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Storage buckets (run separately in Supabase dashboard)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('media', 'media', true),
  ('ava-voice', 'ava-voice', true)
ON CONFLICT DO NOTHING;
