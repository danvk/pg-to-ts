/// Testing ////

import PgPromise from 'pg-promise';

import {any, Queryable, TypedSQL} from './db-utils';
import {tables} from './dbschema';

const typedDb = new TypedSQL(tables);

const commentsTable = typedDb.table('comment');
const selectComment = commentsTable.select();
const selectUser = typedDb.table('users').select();

// TODO: maybe this should be the same as typetests

const pgp = PgPromise();

afterAll(() => {
  pgp.end();
});

// TODO: intercept the queries and assert what those are.

describe('select queries ', () => {
  const db: Queryable = pgp(process.env.POSTGRES_URL!);

  it('should select all', async () => {
    const selectAll = selectComment.fn();
    expect(await selectAll(db)).toMatchInlineSnapshot(`
      Array [
        Object {
          "author_id": "d0e23a20-1f62-4f80-ad29-3ad48a03a47f",
          "content_md": "Why are we only writing this doc in March?",
          "created_at": 2022-03-20T01:02:03.000Z,
          "doc_id": "cde34b31-1f62-4f80-ad29-3ad48a03a36e",
          "id": "01234567-1f62-4f80-ad29-3ad48a03a36e",
          "metadata": Object {
            "sentiment": "snarky",
          },
          "modified_at": 2022-03-20T01:02:03.000Z,
          "statuses": "{complete}",
        },
        Object {
          "author_id": "dee5e220-1f62-4f80-ad29-3ad48a03a36e",
          "content_md": "I am _so_ inspired by this!",
          "created_at": 2022-03-19T01:02:03.000Z,
          "doc_id": "01234b31-1f62-4f80-ad29-3ad48a03a36e",
          "id": "12345678-1f62-4f80-ad29-3ad48a03a36e",
          "metadata": Object {
            "sentiment": "happy",
          },
          "modified_at": 2022-03-19T01:02:03.000Z,
          "statuses": "{complete}",
        },
      ]
    `);
  });

  it('should select all with specific columns', async () => {
    const selectCommentCols = selectComment
      .columns(['id', 'author_id', 'content_md'])
      .fn();

    expect(await selectCommentCols(db)).toMatchInlineSnapshot(`
      Array [
        Object {
          "author_id": "d0e23a20-1f62-4f80-ad29-3ad48a03a47f",
          "content_md": "Why are we only writing this doc in March?",
          "id": "01234567-1f62-4f80-ad29-3ad48a03a36e",
        },
        Object {
          "author_id": "dee5e220-1f62-4f80-ad29-3ad48a03a36e",
          "content_md": "I am _so_ inspired by this!",
          "id": "12345678-1f62-4f80-ad29-3ad48a03a36e",
        },
      ]
    `);
  });

  it('should orderBy a single column', async () => {
    const orderedSelectAll = selectComment
      .orderBy([['created_at', 'ASC']])
      .fn();
    expect(await orderedSelectAll(db)).toMatchInlineSnapshot(`
      Array [
        Object {
          "author_id": "dee5e220-1f62-4f80-ad29-3ad48a03a36e",
          "content_md": "I am _so_ inspired by this!",
          "created_at": 2022-03-19T01:02:03.000Z,
          "doc_id": "01234b31-1f62-4f80-ad29-3ad48a03a36e",
          "id": "12345678-1f62-4f80-ad29-3ad48a03a36e",
          "metadata": Object {
            "sentiment": "happy",
          },
          "modified_at": 2022-03-19T01:02:03.000Z,
          "statuses": "{complete}",
        },
        Object {
          "author_id": "d0e23a20-1f62-4f80-ad29-3ad48a03a47f",
          "content_md": "Why are we only writing this doc in March?",
          "created_at": 2022-03-20T01:02:03.000Z,
          "doc_id": "cde34b31-1f62-4f80-ad29-3ad48a03a36e",
          "id": "01234567-1f62-4f80-ad29-3ad48a03a36e",
          "metadata": Object {
            "sentiment": "snarky",
          },
          "modified_at": 2022-03-20T01:02:03.000Z,
          "statuses": "{complete}",
        },
      ]
    `);
    // TODO: test multiple order bys
  });

  it('should select by a single column', async () => {
    const selectUsersById = selectUser.where(['id']).fn();
    expect(
      await selectUsersById(db, {id: 'dee5e220-1f62-4f80-ad29-3ad48a03a36e'}),
    ).toMatchInlineSnapshot(`
      Array [
        Object {
          "id": "dee5e220-1f62-4f80-ad29-3ad48a03a36e",
          "name": "John Deere",
          "pronoun": "he/him",
        },
      ]
    `);

    expect(
      await selectUsersById(db, {id: 'fff5e220-1f62-4f80-ad29-3ad48a03a36e'}),
    ).toMatchInlineSnapshot(`Array []`);
  });

  it.only('should allow selecting by a set of possible values', async () => {
    const selectAnyOf = selectUser.where([any('id')]).fn();

    const users1 = await selectAnyOf(db, {
      id: new Set(['d0e23a20-1f62-4f80-ad29-3ad48a03a47f', 'abc']),
    });
    expect(users1).toMatchInlineSnapshot(`
      Array [
        Object {
          "id": "d0e23a20-1f62-4f80-ad29-3ad48a03a47f",
          "name": "Jane Doe",
          "pronoun": "she/her",
        },
      ]
    `);

    const usersArray = await selectAnyOf(db, {
      id: ['d0e23a20-1f62-4f80-ad29-3ad48a03a47f', 'abc'],
    });
    expect(usersArray).toEqual(users1);
  });

  it('should select by primary key', async () => {
    const selectById = commentsTable.selectByPrimaryKey().fn();
    const comment123 = await selectById(db, {id: '123'});
    expect(comment123).toMatchInlineSnapshot();
  });

  it('should select by primary key with limited columns', async () => {
    const selectById = commentsTable.selectByPrimaryKey();
    const selectByIdCols = selectById
      .columns(['doc_id', 'author_id', 'content_md'])
      .fn();

    const comment123 = await selectByIdCols(db, {id: '123'});
    expect(comment123).toMatchInlineSnapshot();
  });

  it('should combine singular and plural where clauses', async () => {
    const complexSelect = selectComment
      .where(['author_id', any('doc_id')])
      .columns(['id', 'author_id', 'metadata'])
      .fn();

    const comments = await complexSelect(db, {
      author_id: 'abc',
      doc_id: new Set(['123', '345']),
    });
    expect(comments).toMatchInlineSnapshot();
  });

  it('should allow multiple plural where clauses', async () => {
    const select = selectComment.where([any('author_id'), any('doc_id')]).fn();
    const comments = await select(db, {doc_id: [], author_id: []});
    expect(comments).toMatchInlineSnapshot();
  });

  describe('joins', () => {
    it('should join to another table with all columns', async () => {
      const selectJoin = selectComment.join('author_id').fn();
      const comments = await selectJoin(db);
      expect(comments).toMatchInlineSnapshot();
    });

    it('should join to another table with select columns', async () => {
      const selectSome = selectComment
        .join('author_id')
        .columns(['id', 'metadata'])
        .fn();

      const comments = await selectSome(db);
      expect(comments).toMatchInlineSnapshot();
    });

    it('should join to multiple tables', async () => {
      const selectTwoJoins = selectComment
        .join('author_id')
        .join('doc_id')
        .fn();

      const comments = await selectTwoJoins(db);
      expect(comments).toMatchInlineSnapshot();
    });

    it('should join with selectByPrimaryKey', async () => {
      const select = commentsTable.selectByPrimaryKey().join('author_id').fn();

      const comments = await select(db, {id: ''});
      expect(comments).toMatchInlineSnapshot();
    });

    it('should join with selectByPrimaryKey and specific columns', async () => {
      const selectSome = commentsTable
        .selectByPrimaryKey()
        .join('author_id')
        .columns(['id', 'metadata'])
        .fn();

      const comments = await selectSome(db, {id: ''});
      expect(comments).toMatchInlineSnapshot();
    });
  });
});
