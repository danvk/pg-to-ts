/**
 * Generate typescript interface from table schema
 * Created by xiamx on 2016-08-10.
 */

//tslint:disable

import _ from 'lodash';

import {TableDefinition, ForeignKey} from './schemaInterfaces';
import Options from './options';

function nameIsReservedKeyword(name: string): boolean {
  const reservedKeywords = ['string', 'number', 'package', 'public'];
  return reservedKeywords.indexOf(name) !== -1;
}

export function normalizeName(name: string): string {
  if (nameIsReservedKeyword(name)) {
    return name + '_';
  } else {
    return name;
  }
}

export function toCamelCase(name: string) {
  return name
    .split('_')
    .map(word => (word ? word[0].toUpperCase() + word.slice(1) : ''))
    .join('');
}

export function quotedArray(xs: string[]) {
  return '[' + xs.map(x => `'${x}'`).join(', ') + ']';
}

export function quoteNullable(x: string | null | undefined) {
  return x === null || x === undefined ? 'null' : `'${x}'`;
}

export function quoteForeignKeyMap(x: {
  [columnName: string]: ForeignKey;
}): string {
  const colsTs = _.map(
    x,
    (v, k) => `${k}: { table: '${v.table}', column: '${v.column}' },`,
  );
  return '{' + colsTs.join('\n  ') + '}';
}

const JSDOC_TYPE_RE = /@type \{([^}]+)\}/;

function isNonNullish<T>(x: T): x is Exclude<T, null | undefined> {
  return x !== null && x !== undefined;
}

/** Returns [Table TypeScript, set of TS types to import] */
export function generateTableInterface(
  tableNameRaw: string,
  tableDefinition: TableDefinition,
  options: Options,
): [string, Set<string>] {
  const tableName = options.transformTypeName(tableNameRaw);
  let selectableMembers = '';
  let insertableMembers = '';
  const columns: string[] = [];
  const requiredForInsert: string[] = [];
  const typesToImport = new Set<string>();

  for (const columnNameRaw of Object.keys(tableDefinition.columns)) {
    const columnName = options.transformColumnName(columnNameRaw),
      columnDef = tableDefinition.columns[columnNameRaw],
      comment = columnDef.comment,
      possiblyOrNull = columnDef.nullable ? ' | null' : '',
      insertablyOptional =
        columnDef.nullable || columnDef.hasDefault ? '?' : '',
      jsdoc = comment ? `/** ${comment} */\n` : '';

    let {tsType} = columnDef;
    if (tsType === 'Json' && options.options.jsonTypesFile && comment) {
      const m = JSDOC_TYPE_RE.exec(comment);
      if (m) {
        tsType = m[1].trim();
        typesToImport.add(tsType);
      }
    }

    selectableMembers += `${jsdoc}${columnName}: ${tsType}${possiblyOrNull};\n`;
    insertableMembers += `${jsdoc}${columnName}${insertablyOptional}: ${tsType}${possiblyOrNull};\n`;

    columns.push(columnName);
    if (!columnDef.nullable && !columnDef.hasDefault) {
      requiredForInsert.push(columnName);
    }
  }

  const normalizedTableName = normalizeName(tableName);
  const camelTableName = toCamelCase(normalizedTableName);
  const {primaryKey, comment} = tableDefinition;
  const foreignKeys = _.pickBy(
    _.mapValues(tableDefinition.columns, c => c.foreignKey),
    isNonNullish,
  );
  const jsdoc = comment ? `/** ${comment} */\n` : '';
  return [
    `
      // Table ${tableName}
      ${jsdoc} export interface ${camelTableName} {
        ${selectableMembers}}
      ${jsdoc} export interface ${camelTableName}Input {
        ${insertableMembers}}
      const ${normalizedTableName} = {
        tableName: '${tableName}',
        columns: ${quotedArray(columns)},
        requiredForInsert: ${quotedArray(requiredForInsert)},
        primaryKey: ${quoteNullable(primaryKey)},
        foreignKeys: ${quoteForeignKeyMap(foreignKeys)},
        $type: null as unknown as ${camelTableName},
        $input: null as unknown as ${camelTableName}Input
      } as const;
  `,
    typesToImport,
  ];
}

export function generateEnumType(
  enumObject: Record<string, string[]>,
  options: Options,
) {
  let enumString = '';
  for (const enumNameRaw in enumObject) {
    const enumName = options.transformTypeName(enumNameRaw);
    enumString += `export type ${enumName} = `;
    enumString += enumObject[enumNameRaw]
      .map((v: string) => `'${v}'`)
      .join(' | ');
    enumString += ';\n';
  }
  return enumString;
}
