#! /usr/bin/env node
/**
 * Commandline interface
 * Created by xiamx on 2016-08-10.
 */

import * as yargs from 'yargs';
import * as fs from 'fs';
import {typescriptOfSchema} from './index';

// Doesn't work running npm i with pg-promise + node 6, works with node 8.15.1
// Node 14 doesn't work, silently fails at this.db.map on public schema

interface SchematsConfig {
  conn?: string;
  table?: string[];
  excludedTable?: string[];
  schema: string;
  output: string;
  camelCase: boolean;
  noHeader: boolean;
  datesAsStrings: boolean;
  jsonTypesFile: string;
  env?: string;
}

let argv: SchematsConfig = yargs
  .usage('Usage: $0 <command> [options]')
  .global('config')
  .default('config', 'schemats.json')
  .config()

  .env('SCHEMATS')
  .command('generate', 'generate type definition')
  .demand(1)
  // tslint:disable-next-line
  .example(
    '$0 generate -c postgres://username:password@localhost/db -t table1 -t table2 -s schema -o interface_output.ts',
    'generate typescript interfaces from schema',
  )

  // Pass env-var as -c with $ prefix? e.g. $DB_STRING
  // .demand('c')
  .alias('c', 'conn')
  .nargs('c', 1)
  .describe('c', 'database connection string')

  .alias('e', 'env')
  .nargs('e', 1)
  .describe('e', 'environment variable name')

  .alias('t', 'table')
  .array('t')
  .describe('t', 'table name')

  .alias('x', 'excludedTable')
  .array('x')
  .describe('x', 'excluded table name')

  .alias('s', 'schema')
  .nargs('s', 1)
  .describe('s', 'schema name')

  .alias('C', 'camelCase')
  .describe('C', 'Camel-case columns')

  .describe(
    'datesAsStrings',
    'Treat date, timestamp, and timestamptz as strings, not Dates. ' +
      'Note that you will have to ensure that this is accurate at runtime. ' +
      'See https://github.com/brianc/node-pg-types for details.',
  )

  .describe(
    'jsonTypesFile',
    'If a JSON column has an @type jsdoc tag in its comment, assume that ' +
      'type can be imported from this path.',
  )

  .describe('noHeader', 'Do not write header')

  .demand('o')
  .nargs('o', 1)
  .alias('o', 'output')
  .describe('o', 'output file name')

  .help('h')
  .alias('h', 'help').argv;

(async () => {
  if (!argv.conn && !argv.env) {
    throw new Error('One of conn or env must be provided')
  }

  if (argv.conn && argv.env) {
    console.warn('Conn & env have both been provided... continuing with conn string')
  }

  try {
    let formattedOutput = await typescriptOfSchema(
      argv.conn,
      argv.table,
      argv.excludedTable,
      argv.schema,
      {
        camelCase: argv.camelCase,
        writeHeader: !argv.noHeader,
        datesAsStrings: argv.datesAsStrings,
        jsonTypesFile: argv.jsonTypesFile,
      },
      argv.env,
    );
    fs.writeFileSync(argv.output, formattedOutput);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})()
  .then(() => {
    process.exit();
  })
  .catch((e: any) => {
    console.warn(e);
    process.exit(1);
  });
