import * as fs from 'mz/fs';
import {typescriptOfSchema} from '../src/index';
import ts from 'typescript';
import {diffLines} from 'diff';
import {PostgresDatabase} from '../src/schemaPostgres';

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

/**
 * Removes leading indents from a template string without removing all leading whitespace.
 * Based on code from tslint.
 */
export function dedent(
  strings: TemplateStringsArray,
  ...values: (string | number)[]
) {
  let fullString = strings.reduce(
    (accumulator, str, i) => accumulator + values[i - 1] + str,
  );

  if (fullString.startsWith('\n')) {
    fullString = fullString.slice(1);
  }

  // match all leading spaces/tabs at the start of each line
  const match = fullString.match(/^[ \t]*(?=\S)/gm);
  if (!match) {
    // e.g. if the string is empty or all whitespace.
    return fullString;
  }

  // find the smallest indent, we don't want to remove all leading whitespace
  const indent = Math.min(...match.map(el => el.length));
  if (indent > 0) {
    const regexp = new RegExp('^[ \\t]{' + indent + '}', 'gm');
    fullString = fullString.replace(regexp, '');
  }
  return fullString;
}
