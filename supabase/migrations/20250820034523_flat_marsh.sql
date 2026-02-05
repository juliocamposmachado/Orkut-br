/*
  # Create calls and presence system for WebRTC

  1. New Tables
    - `calls`
      - `id` (uuid, primary key)
      - `caller` (uuid, references profiles)
      - `callee` (uuid, references profiles)
      - `type` (text, check constraint)
      - `status` (text, check constraint)
      - `sdp_offer` (text)
      - `sdp_answer` (text)
      - `created_at` (timestamptz)
      - `ended_at` (timestamptz)
    - `presence`
      - `profile_id` (uuid, primary key, references profiles)
      - `last_seen` (timestamptz)
      - `online` (boolean, default false)

  2. Security
    - Enable RLS on both tables
    - Users can only see calls involving them
    - Presence is publicly viewable
*/

CREATE TABLE IF NOT EXISTS calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  caller uuid REFERENCES profiles(id) ON DELETE CASCADE,
  callee uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text CHECK (type IN ('audio','video')) NOT NULL,
  status text CHECK (status IN ('ringing','accepted','ended','missed')) DEFAULT 'ringing',
  sdp_offer text,
  sdp_answer text,
  ice_candidates jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

CREATE TABLE IF NOT EXISTS presence (
  profile_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  last_seen timestamptz DEFAULT now(),
  online boolean DEFAULT false,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calls
CREATE POLICY "Users can view calls involving them"
  ON calls FOR SELECT
  USING (auth.uid() = caller OR auth.uid() = callee);

CREATE POLICY "Users can create calls"
  ON calls FOR INSERT
  WITH CHECK (auth.uid() = caller);

CREATE POLICY "Users can update calls involving them"
  ON calls FOR UPDATE
  USING (auth.uid() = caller OR auth.uid() = callee);

-- RLS Policies for presence
CREATE POLICY "Presence is viewable by everyone"
  ON presence FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own presence"
  ON presence FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);