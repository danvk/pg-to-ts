import * as fs from 'mz/fs';
import {typescriptOfSchema} from '../src/index';
import ts from 'typescript';
import diff from 'diff';
import { PostgresDatabase } from '../src/schemaPostgres';

interface IDiffResult {
  value: string;
  count?: number;
  added?: boolean;
  removed?: boolean;
}

export function compile(
  fileNames: string[],
  options: ts.CompilerOptions,
): boolean {
  const program = ts.createProgram(fileNames, options);
  const emitResult = program.emit();
  const exitCode = emitResult.emitSkipped ? 1 : 0;
  return exitCode === 0;
}
export async function compare(
  goldStandardFile: string,
  outputFile: string,
): Promise<boolean> {
  const gold = await fs.readFile(goldStandardFile, {encoding: 'utf8'});
  const actual = await fs.readFile(outputFile, {encoding: 'utf8'});

  const diffs = diff.diffLines(gold, actual, {
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
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const config = require(inputConfigFile);
  const formattedOutput = await typescriptOfSchema(
    db,
    config.tables,
    [],
    config.schema,
    {camelCase: config.camelCase, writeHeader: config.writeHeader},
  );
  await fs.writeFile(outputFile, formattedOutput);
}
