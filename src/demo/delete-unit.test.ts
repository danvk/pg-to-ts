import {any, Queryable, TypedSQL} from './db-utils';
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

describe('delete unit', () => {
  it('should delete all entries', async () => {
    const deleteAll = userTable.delete().fn();
    await deleteAll(mockDb, {});
    expect(mockDb.q).toMatchInlineSnapshot(`"DELETE FROM users RETURNING *"`);
    expect(mockDb.args).toMatchInlineSnapshot(`Array []`);
  });

  it('should delete entries matching an ID', async () => {
    const deleteOne = userTable.deleteByPrimaryKey().fn();
    await deleteOne(mockDb, {id: 'blah'});
    expect(mockDb.q).toMatchInlineSnapshot(
      `"DELETE FROM users WHERE id = $1 LIMIT 1 RETURNING *"`,
    );
    expect(mockDb.args).toMatchInlineSnapshot(`
      Array [
        "blah",
      ]
    `);
  });

  it('should delete entries matching a set of IDs', async () => {
    const deleteOne = userTable
      .delete()
      .where([any('id')])
      .fn();
    await deleteOne(mockDb, {id: ['id1', 'id2']});
    expect(mockDb.q).toMatchInlineSnapshot(
      `"DELETE FROM users WHERE id::text = ANY($1) RETURNING *"`,
    );
    expect(mockDb.args).toMatchInlineSnapshot(`
      Array [
        Array [
          "id1",
          "id2",
        ],
      ]
    `);
  });
});
