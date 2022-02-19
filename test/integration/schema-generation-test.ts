import {PostgresDatabase} from '../../src/schemaPostgres';
import {writeTsFile, compare, loadSchema} from '../testUtility';

export const schemaGenerationTest = () => {
  describe('postgres', () => {
    let db: PostgresDatabase;
    beforeAll(async function () {
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
      const outputFile = './test/actual/postgres/osm.ts';
      const expectedFile = './test/expected/postgres/osm.ts';
      const config = './test/fixture/postgres/osm.json';
      await writeTsFile(inputSQLFile, config, outputFile, db);
      expect(await compare(expectedFile, outputFile)).toBeTruthy();
    });

    it('Camelcase generation', async () => {
      const inputSQLFile = 'test/fixture/postgres/osm.sql';
      const outputFile = './test/actual/postgres/osm-camelcase.ts';
      const expectedFile = './test/expected/postgres/osm-camelcase.ts';
      const config = './test/fixture/postgres/osm-camelcase.json';
      await writeTsFile(inputSQLFile, config, outputFile, db);
      expect(await compare(expectedFile, outputFile)).toBeTruthy();
    });

    it('pg-to-sql features', async () => {
      const inputSQLFile = 'test/fixture/postgres/pg-to-ts.sql';
      const outputFile = './test/actual/postgres/pg-to-ts.ts';
      const expectedFile = './test/expected/postgres/pg-to-ts.ts';
      const config = './test/fixture/postgres/pg-to-ts.json';
      await writeTsFile(inputSQLFile, config, outputFile, db);
      expect(await compare(expectedFile, outputFile)).toBeTruthy();
    });
  });
};
