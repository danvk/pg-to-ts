/// Testing ////

import {Queryable, TypedSQL} from './db-utils';
import {tables} from './demo-schema';

const typedDb = new TypedSQL(tables);

const userTable = typedDb.table('users');
// const commentsTable = typedDb.table('comment');
// const docTable = typedDb.table('doc');

const mockDb: Queryable & {q: string; args: string[]} = {
  q: '',
  args: [],
  async query(q, args) {
    this.q = q;
    this.args = args;
    return [{}];
  },
};

describe('insert', () => {
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
