import {TypedSQL} from './db-utils';
import {tables} from './demo-schema';
import {getDbForTests} from './test-utils';

const typedDb = new TypedSQL(tables);

const userTable = typedDb.table('users');
// const commentsTable = typedDb.table('comment');
// const docTable = typedDb.table('doc');

const GUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

describe('insert e2e', () => {
  const db = getDbForTests();

  const insertUser = userTable.insert().fn();
  const insertMultipleUsers = userTable.insertMultiple().fn();
  const selectAllUsers = userTable.select().fn();

  it('should insert a user', async () => {
    const initUsers = await selectAllUsers(db);
    expect(initUsers).toHaveLength(2);

    await insertUser(db, {name: 'Joseph Doe', pronoun: 'he/him'});
    const users = await selectAllUsers(db);
    expect(users).toHaveLength(3);

    expect(users[2]).toMatchObject({
      name: 'Joseph Doe',
      pronoun: 'he/him',
      id: expect.stringMatching(GUID_RE),
    });
  });

  it('should insert a user without a disallowed column', async () => {
    const insertNoId = userTable.insert().disallowColumns(['id']).fn();
    await insertNoId(db, {name: 'Joseph Doe', pronoun: 'he/him'});
    const users = await selectAllUsers(db);
    expect(users).toHaveLength(3);

    expect(users[2]).toMatchObject({
      name: 'Joseph Doe',
      pronoun: 'he/him',
      id: expect.stringMatching(GUID_RE),
    });
  });

  it('should insert multiple users', async () => {
    const initUsers = await selectAllUsers(db);
    expect(initUsers).toHaveLength(2);

    const results = await insertMultipleUsers(db, [
      {name: 'Michael Jordan'},
      {name: 'Scottie Pippen'},
    ]);
    expect(results).toMatchObject([
      {
        name: 'Michael Jordan',
        pronoun: null,
        id: expect.stringMatching(GUID_RE),
      },
      {
        name: 'Scottie Pippen',
        pronoun: null,
        id: expect.stringMatching(GUID_RE),
      },
    ]);

    const finalusers = await selectAllUsers(db);
    expect(finalusers).toHaveLength(4);
  });
});
