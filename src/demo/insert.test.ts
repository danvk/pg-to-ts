import PgPromise from 'pg-promise';

import {Queryable, TypedSQL} from './db-utils';
import {tables} from './demo-schema';

const typedDb = new TypedSQL(tables);

const userTable = typedDb.table('users');
// const commentsTable = typedDb.table('comment');
// const docTable = typedDb.table('doc');
const pgp = PgPromise();

afterAll(() => {
  pgp.end();
});

describe('insert', () => {
  if (!process.env.POSTGRES_URL) {
    throw new Error('Must set POSTGRES_URL to run unit tests');
  }
  const rawDb = pgp(process.env.POSTGRES_URL);
  const mockDb: Queryable & {q: string; args: string[]} = {
    q: '',
    args: [],
    async query(q, args) {
      this.q = q;
      this.args = args;
    },
  };
  const realDb: Queryable & {q: string; args: string[]} = {
    q: '',
    args: [],
    query(q, args) {
      this.q = q;
      this.args = args;
      return rawDb.query(q, args);
    },
  };

  const insertUser = userTable.insert().fn();

  it('should generate a simple insert', async () => {
    await insertUser(mockDb, {name: 'John Doe', pronoun: 'he/him'});
    expect(mockDb.q).toMatchInlineSnapshot(
      `"INSERT INTO users(name, pronoun) VALUES ($1, $2) RETURNING *"`,
    );
    expect(mockDb.args).toMatchInlineSnapshot(`
      Array [
        "John Doe",
        "he/him",
      ]
    `);
  });

  it('should generate a simple insert without a disallowed column', async () => {
    const insertNoId = userTable.insert().disallowColumns(['id']).fn();
    await insertNoId(mockDb, {name: 'John Doe', pronoun: 'he/him'});
    expect(mockDb.q).toMatchInlineSnapshot(
      `"INSERT INTO users(name, pronoun) VALUES ($1, $2) RETURNING *"`,
    );
    expect(mockDb.args).toMatchInlineSnapshot(`
      Array [
        "John Doe",
        "he/him",
      ]
    `);

    expect(
      insertNoId(mockDb, {
        // @ts-expect-error id is not allowed
        id: 'blah',
        name: 'John Doe',
        pronoun: 'he/him',
      }),
    ).rejects.toMatchInlineSnapshot(
      `[Error: Cannot insert disallowed column(s) id]`,
    );
  });

  it('should omit an optional column', async () => {
    await insertUser(mockDb, {name: 'John Doe'});
    expect(mockDb.q).toMatchInlineSnapshot(
      `"INSERT INTO users(name) VALUES ($1) RETURNING *"`,
    );
    expect(mockDb.args).toMatchInlineSnapshot(`
      Array [
        "John Doe",
      ]
    `);
  });
});

describe('insert multiple', () => {
  const insertUsers = userTable.insertMultiple().fn();

  it('should generate a simple insert', async () => {
    await insertUsers(mockDb, [
      {name: 'John Doe', pronoun: 'he/him/his'},
      {name: 'Jane Doe', pronoun: 'she/her/hers'},
    ]);
    expect(mockDb.q).toMatchInlineSnapshot(
      `"INSERT INTO users(name, pronoun) VALUES (($1,$2), ($3,$4)) RETURNING *"`,
    );
    expect(mockDb.args).toMatchInlineSnapshot(`
      Array [
        "John Doe",
        "he/him/his",
        "Jane Doe",
        "she/her/hers",
      ]
    `);
  });

  it('should generate a simple insert without a disallowed column', async () => {
    const insertNoId = userTable.insertMultiple().disallowColumns(['id']).fn();
    await insertNoId(mockDb, [
      {name: 'John Doe', pronoun: 'he/him/his'},
      {name: 'Jane Doe', pronoun: 'she/her/hers'},
    ]);
    expect(mockDb.q).toMatchInlineSnapshot(
      `"INSERT INTO users(name, pronoun) VALUES (($1,$2), ($3,$4)) RETURNING *"`,
    );
    expect(mockDb.args).toMatchInlineSnapshot(`
      Array [
        "John Doe",
        "he/him/his",
        "Jane Doe",
        "she/her/hers",
      ]
    `);

    expect(
      insertNoId(mockDb, [
        {
          // @ts-expect-error id is not allowed
          id: 'blah',
          name: 'John Doe',
          pronoun: 'he/him',
        },
      ]),
    ).rejects.toMatchInlineSnapshot(
      `[Error: Cannot insert disallowed column(s) id]`,
    );
  });

  it('should omit an optional column', async () => {
    await insertUsers(mockDb, [{name: 'John Doe'}, {name: 'Jane Doe'}]);
    expect(mockDb.q).toMatchInlineSnapshot(
      `"INSERT INTO users(name) VALUES (($1), ($2)) RETURNING *"`,
    );
    expect(mockDb.args).toMatchInlineSnapshot(`
      Array [
        "John Doe",
        "Jane Doe",
      ]
    `);
  });
});