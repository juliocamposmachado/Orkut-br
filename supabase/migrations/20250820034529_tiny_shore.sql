/*
  # Create settings and audit system

  1. New Tables
    - `settings`
      - `profile_id` (uuid, primary key, references profiles)
      - `voice_enabled` (boolean, default false)
      - `locale` (text, default 'pt-BR')
      - `notifications_enabled` (boolean, default true)
      - `updated_at` (timestamptz)
    - `audit_log`
      - `id` (bigserial, primary key)
      - `actor` (uuid, references profiles)
      - `action` (text)
      - `target` (text)
      - `details` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only manage their own settings
    - Audit log is restricted to owners
*/

CREATE TABLE IF NOT EXISTS settings (
  profile_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  voice_enabled boolean DEFAULT false,
  locale text DEFAULT 'pt-BR',
  notifications_enabled boolean DEFAULT true,
  tts_speed real DEFAULT 1.0,
  tts_volume real DEFAULT 0.8,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id bigserial PRIMARY KEY,
  actor uuid REFERENCES profiles(id) ON DELETE CASCADE,
  action text NOT NULL,
  target text,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for settings
CREATE POLICY "Users can manage their own settings"
  ON settings FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- RLS Policies for audit_log
CREATE POLICY "Users can view their own audit log"
  ON audit_log FOR SELECT
  USING (auth.uid() = actor);

CREATE POLICY "System can insert audit log"
  ON audit_log FOR INSERT
  WITH CHECK (true);