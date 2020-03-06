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

export function generateTableInterface(tableNameRaw: string, tableDefinition: TableDefinition, options: Options) {
  const tableName = options.transformTypeName(tableNameRaw);
  let selectableMembers = '';
  let insertableMembers = '';
  const columns: string[] = [];
  const requiredForInsert: string[] = [];

  Object.keys(tableDefinition).forEach(columnNameRaw => {
    const
      columnName = options.transformColumnName(columnNameRaw),
      columnDef = tableDefinition[columnNameRaw],
      possiblyOrNull = columnDef.nullable ? ' | null' : '',
      insertablyOptional = columnDef.nullable || columnDef.hasDefault ? '?' : '';

    selectableMembers += `${columnName}: ${columnDef.tsType}${possiblyOrNull};\n`;
    insertableMembers += `${columnName}${insertablyOptional}: ${columnDef.tsType}${possiblyOrNull};\n`;

    columns.push(columnName);
    if (!columnDef.nullable && !columnDef.hasDefault) {
      requiredForInsert.push(columnName);
    }
  });
  const columnsTs = columns.map(column => `'${column}'`).join(', ');
  const insertColumnsTs = requiredForInsert.map(column => `'${column}'`).join(', ');

  const normalizedTableName = normalizeName(tableName, options);
  const camelTableName = toCamelCase(normalizedTableName);
  return `
      // Table ${tableName}
      export interface ${camelTableName} {
        ${selectableMembers}}
      export interface ${camelTableName}Input {
        ${insertableMembers}}
      const ${normalizedTableName} = {
        tableName: '${tableName}',
        columns: [${columnsTs}],
        requiredForInsert: [${insertColumnsTs}],
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

export function generateTableTypes(tableNameRaw: string, tableDefinition: TableDefinition, options: Options) {
  const tableName = options.transformTypeName(tableNameRaw)
  let fields = ''
  Object.keys(tableDefinition).forEach((columnNameRaw) => {
    let type = tableDefinition[columnNameRaw].tsType
    let nullable = tableDefinition[columnNameRaw].nullable ? '| null' : ''
    const columnName = options.transformColumnName(columnNameRaw)
    fields += `export type ${normalizeName(columnName, options)} = ${type}${nullable};\n`
  })

  return `
        export namespace ${tableName}Fields {
        ${fields}
        }
    `
}
