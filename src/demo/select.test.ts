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
  const rawDb = pgp(process.env.POSTGRES_URL!);
  const db: Queryable & {q: string; args: string[]} = {
    q: '',
    args: [],
    query(q, args) {
      this.q = q;
      this.args = args;
      return rawDb.query(q, args);
    },
  };

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
    expect(db.q).toMatchInlineSnapshot(`"SELECT * FROM users WHERE id = $1"`);
    expect(db.args).toMatchInlineSnapshot(`
      Array [
        "dee5e220-1f62-4f80-ad29-3ad48a03a36e",
      ]
    `);

    expect(
      await selectUsersById(db, {id: 'fff5e220-1f62-4f80-ad29-3ad48a03a36e'}),
    ).toMatchInlineSnapshot(`Array []`);
  });

  it('should allow selecting by a set of possible values', async () => {
    const selectAnyOf = selectUser.where([any('id')]).fn();

    const users1 = await selectAnyOf(db, {
      id: new Set(['d0e23a20-1f62-4f80-ad29-3ad48a03a47f', 'abc']),
    });
    expect(db.q).toMatchInlineSnapshot(
      `"SELECT * FROM users WHERE id::text = ANY($1)"`,
    );
    expect(db.args).toMatchInlineSnapshot(`
      Array [
        Array [
          "d0e23a20-1f62-4f80-ad29-3ad48a03a47f",
          "abc",
        ],
      ]
    `);
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
    const selectById = typedDb.table('users').selectByPrimaryKey().fn();
    const userDoe = await selectById(db, {
      id: 'd0e23a20-1f62-4f80-ad29-3ad48a03a47f',
    });
    expect(userDoe).toMatchInlineSnapshot(`
      Object {
        "id": "d0e23a20-1f62-4f80-ad29-3ad48a03a47f",
        "name": "Jane Doe",
        "pronoun": "she/her",
      }
    `);

    const userNone = await selectById(db, {
      id: 'deadbeef-1f62-4f80-ad29-3ad48a03a47f',
    });
    expect(userNone).toBeNull();
  });

  it('should select by primary key with limited columns', async () => {
    const selectById = commentsTable.selectByPrimaryKey();
    const selectByIdCols = selectById
      .columns(['doc_id', 'author_id', 'content_md'])
      .fn();

    const comment123 = await selectByIdCols(db, {
      id: '01234567-1f62-4f80-ad29-3ad48a03a36e',
    });
    expect(db.query).toMatchInlineSnapshot();
    expect(db.args).toMatchInlineSnapshot();
    expect(comment123).toMatchInlineSnapshot(`
      Object {
        "author_id": "d0e23a20-1f62-4f80-ad29-3ad48a03a47f",
        "content_md": "Why are we only writing this doc in March?",
        "doc_id": "cde34b31-1f62-4f80-ad29-3ad48a03a36e",
      }
    `);
  });

  it('should combine singular and plural where clauses', async () => {
    const complexSelect = selectComment
      .where(['author_id', any('doc_id')])
      .columns(['id', 'author_id', 'metadata'])
      .fn();

    const comments = await complexSelect(db, {
      author_id: 'd0e23a20-1f62-4f80-ad29-3ad48a03a47f',
      doc_id: new Set([
        'cde34b31-1f62-4f80-ad29-3ad48a03a36e',
        '01234b31-1f62-4f80-ad29-3ad48a03a36e',
      ]),
    });
    expect(comments).toHaveLength(1);
    expect(db.q).toMatchInlineSnapshot(
      `"SELECT id, author_id, metadata FROM comment WHERE author_id = $1 AND doc_id::text = ANY($2)"`,
    );
    expect(db.args).toMatchInlineSnapshot(`
      Array [
        "d0e23a20-1f62-4f80-ad29-3ad48a03a47f",
        Array [
          "cde34b31-1f62-4f80-ad29-3ad48a03a36e",
          "01234b31-1f62-4f80-ad29-3ad48a03a36e",
        ],
      ]
    `);
  });

  it('should allow multiple plural where clauses', async () => {
    const select = selectComment.where([any('author_id'), any('doc_id')]).fn();
    const comments = await select(db, {doc_id: [], author_id: []});
    expect(comments).toMatchInlineSnapshot(`Array []`);
    expect(db.q).toMatchInlineSnapshot(
      `"SELECT * FROM comment WHERE author_id::text = ANY($1) AND doc_id::text = ANY($2)"`,
    );
    expect(db.args).toMatchInlineSnapshot(`
      Array [
        Array [],
        Array [],
      ]
    `);
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
