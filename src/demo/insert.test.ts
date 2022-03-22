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
  it('should generate a simple insert', async () => {
    const insertUser = userTable.insert().fn();
    await insertUser(mockDb, {name: 'John Doe', pronoun: 'he/him'});
    expect(mockDb.q).toMatchInlineSnapshot(
      `"INSERT INTO users(id, name, pronoun) VALUES ($1, $2, $3) RETURNING *"`,
    );
    expect(mockDb.args).toMatchInlineSnapshot(`
      Array [
        undefined,
        "John Doe",
        "he/him",
      ]
    `);
  });
});
