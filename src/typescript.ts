/**
 * Generate typescript interface from table schema
 * Created by xiamx on 2016-08-10.
 */

//tslint:disable

import * as _ from 'lodash'

import { TableDefinition } from './schemaInterfaces'
import Options from './options'

function nameIsReservedKeyword(name: string): boolean {
  const reservedKeywords = [
    'string',
    'number',
    'package',
    'public',
  ]
  return reservedKeywords.indexOf(name) !== -1
}

export function normalizeName(name: string, options: Options): string {
  if (nameIsReservedKeyword(name)) {
    return name + '_'
  } else {
    return name
  }
}

export function toCamelCase(name: string) {
  return name.split('_').map(word => word[0].toUpperCase() + word.slice(1)).join('')
}

export function quotedArray(xs: string[]) {
  return '[' + xs.map(x => `'${x}'`).join(', ') + ']';
}

export function quoteNullable(x: string | null | undefined) {
  return (x === null || x === undefined) ? 'null' : `'${x}'`;
}

export function generateTableInterface(tableNameRaw: string, tableDefinition: TableDefinition, options: Options) {
  const tableName = options.transformTypeName(tableNameRaw);
  let selectableMembers = '';
  let insertableMembers = '';
  const columns: string[] = [];
  const requiredForInsert: string[] = [];

  for (const columnNameRaw of Object.keys(tableDefinition.columns)) {
    const
      columnName = options.transformColumnName(columnNameRaw),
      columnDef = tableDefinition.columns[columnNameRaw],
      possiblyOrNull = columnDef.nullable ? ' | null' : '',
      insertablyOptional = columnDef.nullable || columnDef.hasDefault ? '?' : '',
      jsDoc = columnDef.comment ? `/** ${columnDef.comment} */\n` : '';

    selectableMembers += `${jsDoc}${columnName}: ${columnDef.tsType}${possiblyOrNull};\n`;
    insertableMembers += `${jsDoc}${columnName}${insertablyOptional}: ${columnDef.tsType}${possiblyOrNull};\n`;

    columns.push(columnName);
    if (!columnDef.nullable && !columnDef.hasDefault) {
      requiredForInsert.push(columnName);
    }
  }

  const normalizedTableName = normalizeName(tableName, options);
  const camelTableName = toCamelCase(normalizedTableName);
  const {primaryKey} = tableDefinition;
  return `
      // Table ${tableName}
      export interface ${camelTableName} {
        ${selectableMembers}}
      export interface ${camelTableName}Input {
        ${insertableMembers}}
      const ${normalizedTableName} = {
        tableName: '${tableName}',
        columns: ${quotedArray(columns)},
        requiredForInsert: ${quotedArray(requiredForInsert)},
        primaryKey: ${quoteNullable(primaryKey)},
      } as const;
  `;
}

export function generateEnumType(enumObject: any, options: Options) {
  let enumString = ''
  for (let enumNameRaw in enumObject) {
    const enumName = options.transformTypeName(enumNameRaw)
    enumString += `export type ${enumName} = `
    enumString += enumObject[enumNameRaw].map((v: string) => `'${v}'`).join(' | ')
    enumString += ';\n'
    enumString += `export namespace every {\n`
    enumString += `  export type ${enumName} = [`
    enumString += enumObject[enumNameRaw].map((v: string) => `'${v}'`).join(', ') + '];\n'
    enumString += '}\n'
  }
  return enumString
}
