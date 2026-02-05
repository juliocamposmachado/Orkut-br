/*
  # Create communities system

  1. New Tables
    - `communities`
      - `id` (bigserial, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `category` (text)
      - `owner` (uuid, references profiles)
      - `members_count` (int, default 0)
      - `created_at` (timestamptz)
    - `community_members`
      - `community_id` (bigint, references communities)
      - `profile_id` (uuid, references profiles)
      - `role` (text, check constraint)
      - `joined_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Communities are publicly viewable
    - Only members can see membership details
*/

CREATE TABLE IF NOT EXISTS communities (
  id bigserial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  description text DEFAULT '',
  category text DEFAULT 'Geral',
  owner uuid REFERENCES profiles(id) ON DELETE CASCADE,
  members_count int DEFAULT 0,
  photo_url text DEFAULT 'https://images.pexels.com/photos/1595391/pexels-photo-1595391.jpeg?auto=compress&cs=tinysrgb&w=200',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_members (
  community_id bigint REFERENCES communities(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text CHECK (role IN ('member','mod','owner')) DEFAULT 'member',
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (community_id, profile_id)
);

-- Enable RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Communities are viewable by everyone"
  ON communities FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create communities"
  ON communities FOR INSERT
  WITH CHECK (auth.uid() = owner);

CREATE POLICY "Community owners can update their communities"
  ON communities FOR UPDATE
  USING (auth.uid() = owner);

CREATE POLICY "Community memberships viewable by members"
  ON community_members FOR SELECT
  USING (true);

CREATE POLICY "Users can join communities"
  ON community_members FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can leave communities"
  ON community_members FOR DELETE
  USING (auth.uid() = profile_id);