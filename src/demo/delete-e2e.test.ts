import PgPromise from 'pg-promise';

import {any, Queryable, TypedSQL} from './db-utils';
import {tables} from './demo-schema';

const typedDb = new TypedSQL(tables);

// const userTable = typedDb.table('users');
const commentsTable = typedDb.table('comment');
// const docTable = typedDb.table('doc');

const pgp = PgPromise();

afterAll(() => {
  pgp.end();
});

const COMMENT1_ID = '01234567-1f62-4f80-ad29-3ad48a03a36e';
const COMMENT2_ID = '12345678-1f62-4f80-ad29-3ad48a03a36e';

describe('delete e2e', () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('Must set POSTGRES_URL to run unit tests');
  }
  const rawDb = pgp(process.env.POSTGRES_URL);
  const db: Queryable & {q: string; args: string[]} = {
    q: '',
    args: [],
    query(q, args) {
      this.q = q;
      this.args = args;
      return rawDb.query(q, args);
    },
  };

  // Run all tests in a transaction and roll it back to avoid mutating the DB.
  // This will avoid mutations even if the test fails.
  beforeEach(async () => db.query('BEGIN'));
  afterEach(async () => db.query('ROLLBACK'));

  const getAllComments = commentsTable.select().fn();

  it('should delete all entries', async () => {
    const deleteAll = commentsTable.delete().fn();

    expect(await getAllComments(db)).toHaveLength(2);
    expect(await deleteAll(db, {})).toHaveLength(2);
    expect(await getAllComments(db)).toHaveLength(0);
  });

  it('should delete entries matching an ID', async () => {
    expect(await getAllComments(db)).toHaveLength(2);
    const deleteOne = commentsTable.deleteByPrimaryKey().fn();
    expect(await deleteOne(db, {id: COMMENT1_ID})).toMatchObject({
      id: COMMENT1_ID,
      metadata: {sentiment: 'snarky'},
      content_md: 'Why are we only writing this doc in March?',
    });
    const finalComments = await getAllComments(db);
    expect(finalComments).toHaveLength(1);
    expect(finalComments).toMatchObject([{id: COMMENT2_ID}]);
  });

  describe('delete multiple', () => {
    const deleteMultiple = commentsTable
      .delete()
      .where([any('id')])
      .fn();

    it('should delete entries matching an array of IDs', async () => {
      expect(await getAllComments(db)).toHaveLength(2);
      expect(
        await deleteMultiple(db, {id: [COMMENT1_ID, COMMENT2_ID]}),
      ).toHaveLength(2);
      expect(await getAllComments(db)).toHaveLength(0);
    });

    it('should delete entries matching an array of IDs', async () => {
      expect(await getAllComments(db)).toHaveLength(2);
      await deleteMultiple(db, {id: new Set([COMMENT1_ID, COMMENT2_ID])});
      expect(await getAllComments(db)).toHaveLength(0);
    });
  });
});
