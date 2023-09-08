CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS comment;
DROP TABLE IF EXISTS doc;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS table_with_underscores;
DROP TYPE IF EXISTS comment_status_enum;

-- SQL file showing some of the pg-to-ts features

CREATE TYPE comment_status_enum AS ENUM (
    'pending',
    'complete',
    'deleted',
    'archived'
);

CREATE TABLE IF NOT EXISTS users (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  name varchar NOT NULL,
  pronoun varchar
);

CREATE TABLE IF NOT EXISTS doc (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_by uuid not null references users(id),
  title varchar,
  contents text
);

CREATE TABLE IF NOT EXISTS comment (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  doc_id uuid not null references doc(id),
  author_id uuid not null references users(id),
  created_at timestamp with time zone default now(),
  modified_at timestamp with time zone default now(),
  metadata jsonb,
  content_md text not null,
  statuses comment_status_enum[]
);

COMMENT ON TABLE comment IS 'Variant-level comments';
COMMENT ON COLUMN comment.content_md IS 'Content of the comment, formatted with Markdown. May contain @mentions.';
COMMENT ON COLUMN comment.metadata IS 'Additional comment info @type {CommentMetadata}';
COMMENT ON COLUMN comment.statuses IS 'List of statuses; Just an array for testing!';

CREATE TABLE IF NOT EXISTS table_with_underscores (
  column_with_underscores text not null
);
