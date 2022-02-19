import * as fs from 'mz/fs';
import {typescriptOfSchema} from '../src/index';
import {diffLines} from 'diff';
import {PostgresDatabase} from '../src/schemaPostgres';

interface IDiffResult {
  value: string;
  count?: number;
  added?: boolean;
  removed?: boolean;
}

export async function compare(
  goldStandardFile: string,
  outputFile: string,
): Promise<boolean> {
  const gold = await fs.readFile(goldStandardFile, {encoding: 'utf8'});
  const actual = await fs.readFile(outputFile, {encoding: 'utf8'});

  const diffs = diffLines(gold, actual, {
    ignoreWhitespace: true,
    newlineIsToken: true,
    ignoreCase: false,
  });

  const addOrRemovedLines = diffs.filter(
    (d: IDiffResult) => d.added || d.removed,
  );

  if (addOrRemovedLines.length > 0) {
    console.error(
      `Generated type definition different to the standard ${goldStandardFile}`,
    );
    addOrRemovedLines.forEach((d: IDiffResult, i: number) => {
      const t = d.added ? '+' : d.removed ? '-' : 'x';
      console.error(`  [${i}] ${t} ${d.value}`);
    });
    return false;
  } else {
    return true;
  }
}

export async function loadSchema(db: PostgresDatabase, file: string) {
  const query = await fs.readFile(file, {
    encoding: 'utf8',
  });
  return await db.query(query);
}

export async function writeTsFile(
  inputSQLFile: string,
  inputConfigFile: string,
  outputFile: string,
  db: PostgresDatabase,
) {
  await loadSchema(db, inputSQLFile);
  const config = JSON.parse(fs.readFileSync(inputConfigFile, 'utf8'));
  const {tables, schema, ...options} = config;
  const formattedOutput = await typescriptOfSchema(
    db,
    tables,
    [],
    schema,
    options,
  );
  await fs.writeFile(outputFile, formattedOutput);
}
