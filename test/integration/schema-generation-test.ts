import {PostgresDatabase} from '../../src/schemaPostgres';
import {getGeneratedTs, loadSchema} from '../testUtility';

export const schemaGenerationTest = () => {
  describe('postgres', () => {
    let db: PostgresDatabase;
    beforeAll(async function () {
      if (!process.env.POSTGRES_URL) {
        throw new Error(
          'Must set POSTGRES_URL environment variable to run integration tests',
        );
      }
      db = new PostgresDatabase(process.env.POSTGRES_URL);
    });

    beforeEach(async () => {
      db.reset();
      await loadSchema(db, './test/fixture/postgres/initCleanup.sql');
    });

    afterAll(async () => {
      // Jest complains about pending asynchronous operations without this.
      await db.db.$pool.end();
    });

    it('Basic generation', async () => {
      const inputSQLFile = 'test/fixture/postgres/osm.sql';
      const config = './test/fixture/postgres/osm.json';
      expect(await getGeneratedTs(inputSQLFile, config, db)).toMatchSnapshot();
    });

    it('Camelcase generation', async () => {
      const inputSQLFile = 'test/fixture/postgres/osm.sql';
      const config = './test/fixture/postgres/osm-camelcase.json';
      expect(await getGeneratedTs(inputSQLFile, config, db)).toMatchSnapshot();
    });

    it('pg-to-sql features', async () => {
      const inputSQLFile = 'test/fixture/postgres/pg-to-ts.sql';
      const config = './test/fixture/postgres/pg-to-ts.json';
      expect(await getGeneratedTs(inputSQLFile, config, db)).toMatchSnapshot();
    });
  });
};
