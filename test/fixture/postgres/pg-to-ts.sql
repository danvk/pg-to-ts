DROP TABLE IF EXISTS comment;
DROP TABLE IF EXISTS doc;
DROP TABLE IF EXISTS users;

-- SQL file showing some of the pg-to-ts features

CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name varchar NOT NULL,
  pronoun varchar
);

CREATE TABLE IF NOT EXISTS doc (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by uuid not null references users(id),
  title varchar,
  contents text
);

CREATE TABLE IF NOT EXISTS comment (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  doc_id uuid not null references doc(id),
  author_id uuid not null references users(id),
  created_at timestamp with time zone default now(),
  modified_at timestamp with time zone default now(),
  metadata jsonb,
  content_md text not null
);

COMMENT ON TABLE comment IS 'Variant-level comments';
COMMENT ON COLUMN comment.content_md IS 'Content of the comment, formatted with Markdown. May contain @mentions.';
COMMENT ON COLUMN comment.metadata IS 'Additional comment info @type {CommentMetadata}';
