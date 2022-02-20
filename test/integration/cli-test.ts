import {spawnSync} from 'child_process';
import * as fs from 'fs';

// Note that Jest does not collect code coverage from spawned processes,
// so code paths that are only exercised by this test will not counted.
// See https://github.com/facebook/jest/issues/3190

export const cliTest = () => {
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
    expect(status).toEqual(0);
  });

  it('should run without error using a config file', () => {
    fs.writeFileSync(
      '/tmp/config.json',
      JSON.stringify({
        conn: process.env.POSTGRES_URL,
        output: '/tmp/pg-to-ts-config.ts',
      }),
    );

    const {status, stdout, stderr} = spawnSync(
      'node',
      ['dist/cli.js', 'generate', '--config', '/tmp/config.json'],
      {encoding: 'utf-8'},
    );
    console.log('opopopopop', stdout, stderr);
    expect(status).toEqual(0);
  });

  it('should run without error using environment variables', () => {
    const {status, stdout, stderr} = spawnSync(
      'node',
      ['dist/cli.js', 'generate'],
      {
        encoding: 'utf-8',
        env: {
          ...process.env,
          PG_TO_TS_CONN: process.env.POSTGRES_URL,
          PG_TO_TS_OUTPUT: '/tmp/pg-to-ts-env.ts',
        },
      },
    );
    console.log('opopopopop', stdout, stderr);
    expect(status).toEqual(0);
  });
};
