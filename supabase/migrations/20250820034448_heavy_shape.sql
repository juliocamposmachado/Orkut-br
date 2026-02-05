/*
  # Create profiles and friendships tables

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique)
      - `display_name` (text)
      - `photo_url` (text)
      - `relationship` (text)
      - `location` (text)
      - `birthday` (date)
      - `bio` (text)
      - `fans_count` (int, default 0)
      - `created_at` (timestamptz)
    - `friendships`
      - `id` (bigserial, primary key)
      - `requester` (uuid, references profiles)
      - `addressee` (uuid, references profiles)
      - `status` (text, check constraint)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read public data
    - Users can update their own profile
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  display_name text NOT NULL,
  photo_url text DEFAULT 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
  relationship text DEFAULT 'Solteiro(a)',
  location text DEFAULT '',
  birthday date,
  bio text DEFAULT '',
  fans_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS friendships (
  id bigserial PRIMARY KEY,
  requester uuid REFERENCES profiles(id) ON DELETE CASCADE,
  addressee uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text CHECK (status IN ('pending','accepted','blocked')) DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  UNIQUE(requester, addressee)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- RLS Policies for friendships
CREATE POLICY "Friendships viewable by involved users" 
  ON friendships FOR SELECT 
  USING (auth.uid() = requester OR auth.uid() = addressee);

CREATE POLICY "Users can create friendship requests" 
  ON friendships FOR INSERT 
  WITH CHECK (auth.uid() = requester);

CREATE POLICY "Users can update friendship status" 
  ON friendships FOR UPDATE 
  USING (auth.uid() = addressee);