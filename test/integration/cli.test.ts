import {spawnSync} from 'child_process';
import * as assert from 'power-assert';

describe('schemats cli tool integration testing', () => {
  describe('schemats generate postgres', () => {
    before(async function () {
      if (!process.env.POSTGRES_URL) {
        return this.skip();
      }
    });
    it('should run without error', () => {
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
          '/tmp/schemats_cli_postgres.ts',
        ],
        {encoding: 'utf-8'},
      );
      console.log('opopopopop', stdout, stderr);
      assert.equal(0, status);
    });
  });
});
