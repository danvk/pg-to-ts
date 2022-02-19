import {spawnSync} from 'child_process';
import * as assert from 'power-assert';
import * as fs from 'fs';

describe('schemats cli tool integration testing', () => {
  describe('schemats generate postgres', () => {
    before(async function () {
      if (!process.env.POSTGRES_URL) {
        return this.skip();
      }
    });

    it('should run without error using command line flags', () => {
      if (!process.env.POSTGRES_URL) {
        throw new Error('Missing POSTGRES_URL');
      }
      const {status, stdout, stderr} = spawnSync(
        'node',
        [
          'dist/cli.js',
          'generate',
          '-c',
          process.env.POSTGRES_URL,
          '-o',
          '/tmp/pg-to-ts-flags.ts',
        ],
        {encoding: 'utf-8'},
      );
      console.log('opopopopop', stdout, stderr);
      assert.equal(0, status);
    });

    it('should run without error using a config file', () => {
      fs.writeFileSync('/tmp/config.json', JSON.stringify({
        conn: process.env.POSTGRES_URL,
        output: '/tmp/pg-to-ts-config.ts',
      }));

      const {status, stdout, stderr} = spawnSync(
        'node',
        [
          'dist/cli.js',
          'generate',
          '--config',
          '/tmp/config.json'
        ],
        {encoding: 'utf-8'},
      );
      console.log('opopopopop', stdout, stderr);
      assert.equal(0, status);
    });

    it('should run without error using environment variables', () => {
      after(() => {
        delete process.env.PG_TO_TS_CONN;
        delete process.env.PG_TO_TS_OUTPUT;
      });

      process.env.PG_TO_TS_CONN = process.env.POSTGRES_URL;
      process.env.PG_TO_TS_OUTPUT = '/tmp/pg-to-ts-env.ts';

      const {status, stdout, stderr} = spawnSync(
        'node',
        [
          'dist/cli.js',
          'generate',
        ],
        {encoding: 'utf-8'},
      );
      console.log('opopopopop', stdout, stderr);
      assert.equal(0, status);
    });
  });
});
