/*
  # Create scraps and testimonials (classic Orkut features)

  1. New Tables
    - `scraps`
      - `id` (bigserial, primary key)
      - `to_profile` (uuid, references profiles)
      - `from_profile` (uuid, references profiles)  
      - `content` (text)
      - `created_at` (timestamptz)
    - `testimonials`
      - `id` (bigserial, primary key)
      - `to_profile` (uuid, references profiles)
      - `from_profile` (uuid, references profiles)
      - `content` (text)
      - `approved` (boolean, default false)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can view scraps sent to them or by them
    - Testimonials require approval to be public
*/

CREATE TABLE IF NOT EXISTS scraps (
  id bigserial PRIMARY KEY,
  to_profile uuid REFERENCES profiles(id) ON DELETE CASCADE,
  from_profile uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS testimonials (
  id bigserial PRIMARY KEY,
  to_profile uuid REFERENCES profiles(id) ON DELETE CASCADE,
  from_profile uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE scraps ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scraps
CREATE POLICY "Users can view scraps sent to them or by them"
  ON scraps FOR SELECT
  USING (auth.uid() = to_profile OR auth.uid() = from_profile);

CREATE POLICY "Users can create scraps"
  ON scraps FOR INSERT
  WITH CHECK (auth.uid() = from_profile);

CREATE POLICY "Users can delete scraps sent to them"
  ON scraps FOR DELETE
  USING (auth.uid() = to_profile);

-- RLS Policies for testimonials
CREATE POLICY "Approved testimonials viewable by everyone"
  ON testimonials FOR SELECT
  USING (approved = true OR auth.uid() = to_profile OR auth.uid() = from_profile);

CREATE POLICY "Users can create testimonials"
  ON testimonials FOR INSERT
  WITH CHECK (auth.uid() = from_profile);

CREATE POLICY "Users can approve testimonials sent to them"
  ON testimonials FOR UPDATE
  USING (auth.uid() = to_profile);

CREATE POLICY "Users can delete testimonials sent to them"
  ON testimonials FOR DELETE
  USING (auth.uid() = to_profile);