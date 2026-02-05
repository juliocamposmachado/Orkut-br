/*
  # Create messages and notifications system

  1. New Tables
    - `messages`
      - `id` (bigserial, primary key)
      - `thread_id` (uuid)
      - `sender` (uuid, references profiles)
      - `recipient` (uuid, references profiles)
      - `content` (text)
      - `created_at` (timestamptz)
      - `read` (boolean, default false)
    - `notifications`
      - `id` (bigserial, primary key)
      - `profile_id` (uuid, references profiles)
      - `type` (text)
      - `payload` (jsonb)
      - `read` (boolean, default false)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only see their own messages and notifications
*/

CREATE TABLE IF NOT EXISTS messages (
  id bigserial PRIMARY KEY,
  thread_id uuid DEFAULT gen_random_uuid(),
  sender uuid REFERENCES profiles(id) ON DELETE CASCADE,
  recipient uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  read boolean DEFAULT false,
  archived_by_sender boolean DEFAULT false,
  archived_by_recipient boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS notifications (
  id bigserial PRIMARY KEY,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  payload jsonb DEFAULT '{}',
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for messages
CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  USING (auth.uid() = sender OR auth.uid() = recipient);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender);

CREATE POLICY "Users can update their messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender OR auth.uid() = recipient);

-- RLS Policies for notifications
CREATE POLICY "Users can view their notifications"
  ON notifications FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);