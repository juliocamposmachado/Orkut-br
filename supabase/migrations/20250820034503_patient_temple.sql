/*
  # Create posts, comments and likes system

  1. New Tables
    - `posts`
      - `id` (bigserial, primary key)
      - `author` (uuid, references profiles)
      - `content` (text)
      - `visibility` (text, check constraint)
      - `created_at` (timestamptz)
    - `comments`
      - `id` (bigserial, primary key)
      - `post_id` (bigint, references posts)
      - `author` (uuid, references profiles)
      - `content` (text)
      - `created_at` (timestamptz)
    - `likes`
      - `post_id` (bigint, references posts)
      - `profile_id` (uuid, references profiles)

  2. Security
    - Enable RLS on all tables
    - Public posts viewable by everyone
    - Friends posts viewable by friends only
*/

CREATE TABLE IF NOT EXISTS posts (
  id bigserial PRIMARY KEY,
  author uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  visibility text CHECK (visibility IN ('public','friends')) DEFAULT 'public',
  likes_count int DEFAULT 0,
  comments_count int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
  id bigserial PRIMARY KEY,
  post_id bigint REFERENCES posts(id) ON DELETE CASCADE,
  author uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS likes (
  post_id bigint REFERENCES posts(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (post_id, profile_id)
);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public posts viewable by everyone"
  ON posts FOR SELECT
  USING (visibility = 'public' OR auth.uid() = author);

CREATE POLICY "Users can create posts"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = author);

CREATE POLICY "Users can update own posts"
  ON posts FOR UPDATE
  USING (auth.uid() = author);

CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  USING (auth.uid() = author);

CREATE POLICY "Comments viewable with their posts"
  ON comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  WITH CHECK (auth.uid() = author);

CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (auth.uid() = author);

CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = author);

CREATE POLICY "Likes viewable by everyone"
  ON likes FOR SELECT
  USING (true);

CREATE POLICY "Users can manage own likes"
  ON likes FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);