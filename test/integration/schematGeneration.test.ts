import assert from 'power-assert';
import { PostgresDatabase } from '../../src/schemaPostgres';
import {writeTsFile, compare} from '../testUtility';

describe('schemat generation integration testing', () => {
  describe('postgres', () => {
    let db: PostgresDatabase;
    before(async function () {
      if (!process.env.POSTGRES_URL) {
        return this.skip();
      }
      db = new PostgresDatabase(process.env.POSTGRES_URL);
    });

    it('Basic generation', async () => {
      const inputSQLFile = 'test/fixture/postgres/osm.sql';
      const outputFile = './test/actual/postgres/osm.ts';
      const expectedFile = './test/expected/postgres/osm.ts';
      const config = './fixture/postgres/osm.json';
      await writeTsFile(inputSQLFile, config, outputFile, db);
      return assert(await compare(expectedFile, outputFile));
    });

    it('Camelcase generation', async () => {
      const inputSQLFile = 'test/fixture/postgres/osm.sql';
      const outputFile = './test/actual/postgres/osm-camelcase.ts';
      const expectedFile = './test/expected/postgres/osm-camelcase.ts';
      const config = './fixture/postgres/osm-camelcase.json';
      await writeTsFile(inputSQLFile, config, outputFile, db);
      return assert(await compare(expectedFile, outputFile));
    });

    it.only('pg-to-sql features', async () => {
      const inputSQLFile = 'test/fixture/postgres/pg-to-ts.sql';
      const outputFile = './test/actual/postgres/pg-to-ts.ts';
      const expectedFile = './test/expected/postgres/pg-to-ts.ts';
      const config = './fixture/postgres/pg-to-ts.json';
      await writeTsFile(inputSQLFile, config, outputFile, db);
      return assert(await compare(expectedFile, outputFile));
    });
  });
});
