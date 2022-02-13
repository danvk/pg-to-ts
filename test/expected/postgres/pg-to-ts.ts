/* tslint:disable */
/* eslint-disable */

import { CommentMetadata } from "./pg-to-ts-json-types";


export type Json = unknown;

// Table comment
/** Variant-level comments */
export interface Comment {
  id: string;
  doc_id: string;
  author_id: string;
  created_at: string | null;
  modified_at: string | null;
  /** Additional comment info @type {CommentMetadata} */
  metadata: CommentMetadata | null;
  /** Content of the comment, formatted with Markdown. May contain @mentions. */
  content_md: string;
}
/** Variant-level comments */
export interface CommentInput {
  id?: string;
  doc_id: string;
  author_id: string;
  created_at?: string | null;
  modified_at?: string | null;
  /** Additional comment info @type {CommentMetadata} */
  metadata?: CommentMetadata | null;
  /** Content of the comment, formatted with Markdown. May contain @mentions. */
  content_md: string;
}
const comment = {
  tableName: 'comment',
  columns: ['id', 'doc_id', 'author_id', 'created_at', 'modified_at', 'metadata', 'content_md'],
  requiredForInsert: ['doc_id', 'author_id', 'content_md'],
  primaryKey: 'id',
  foreignKeys: {
    doc_id: { table: 'doc', column: 'id' },
    author_id: { table: 'users', column: 'id' },
  },
} as const;

// Table doc
export interface Doc {
  id: string;
  created_by: string;
  title: string | null;
  contents: string | null;
}
export interface DocInput {
  id?: string;
  created_by: string;
  title?: string | null;
  contents?: string | null;
}
const doc = {
  tableName: 'doc',
  columns: ['id', 'created_by', 'title', 'contents'],
  requiredForInsert: ['created_by'],
  primaryKey: 'id',
  foreignKeys: { created_by: { table: 'users', column: 'id' }, },
} as const;

// Table users
export interface Users {
  id: string;
  name: string;
  pronoun: string | null;
}
export interface UsersInput {
  id?: string;
  name: string;
  pronoun?: string | null;
}
const users = {
  tableName: 'users',
  columns: ['id', 'name', 'pronoun'],
  requiredForInsert: ['name'],
  primaryKey: 'id',
  foreignKeys: {},
} as const;


export interface TableTypes {
  comment: {
    select: Comment;
    input: CommentInput;
  };
  doc: {
    select: Doc;
    input: DocInput;
  };
  users: {
    select: Users;
    input: UsersInput;
  };
}

export const tables = {
  comment,
  doc,
  users,
}
