import {any, Queryable, TypedSQL} from './db-utils';
import {tables} from './demo-schema';

const typedDb = new TypedSQL(tables);

const userTable = typedDb.table('users');
// const commentsTable = typedDb.table('comment');
const docTable = typedDb.table('doc');

const mockDb: Queryable & {q: string; args: string[]} = {
  q: '',
  args: [],
  async query(q, args) {
    this.q = q;
    this.args = args;
    return [{}];
  },
};

describe('update', () => {
  it('should generate update by primary key', async () => {
    const updateByKey = userTable.updateByPrimaryKey().fn();
    await updateByKey(
      mockDb,
      {id: 'john'},
      {name: 'John Doe', pronoun: 'he/him'},
    );
    expect(mockDb.q).toMatchInlineSnapshot(
      `"UPDATE users SET name = $2, pronoun = $3 WHERE id = $1 RETURNING *"`,
    );
    expect(mockDb.args).toMatchInlineSnapshot(`
      Array [
        "john",
        "John Doe",
        "he/him",
      ]
    `);
  });

  it('should update with a where clause', async () => {
    const update = docTable.update().where(['title']).fn();
    await update(
      mockDb,
      {title: 'Great Expectations'},
      {created_by: 'Charles Dickens'},
    );

    expect(mockDb.q).toMatchInlineSnapshot(
      `"UPDATE doc SET created_by = $2 WHERE title = $1 RETURNING *"`,
    );
    expect(mockDb.args).toMatchInlineSnapshot(`
      Array [
        "Great Expectations",
        "Charles Dickens",
      ]
    `);
  });

  it('should update with fixed columns', async () => {
    const update = docTable.update().set(['contents']).where(['title']).fn();
    await update(
      mockDb,
      {title: 'Great Expectations'},
      {contents: 'Twas the best of times, err, I mean…'},
    );

    expect(mockDb.q).toMatchInlineSnapshot(
      `"UPDATE doc SET contents = $1 WHERE title = $2 RETURNING *"`,
    );
    expect(mockDb.args).toMatchInlineSnapshot(`
      Array [
        "Twas the best of times, err, I mean…",
        "Great Expectations",
      ]
    `);
  });

  it('should update with an any clause', async () => {
    const update = docTable
      .update()
      .set(['created_by'])
      .where([any('title')])
      .fn();
    await update(
      mockDb,
      {title: ['Great Expectations', 'Bleak House']},
      {created_by: 'Charles Dickens'},
    );

    expect(mockDb.q).toMatchInlineSnapshot(
      `"UPDATE doc SET created_by = $1 WHERE title::text = ANY($2) RETURNING *"`,
    );
    expect(mockDb.args).toMatchInlineSnapshot(`
      Array [
        "Charles Dickens",
        Array [
          "Great Expectations",
          "Bleak House",
        ],
      ]
    `);
  });
});
