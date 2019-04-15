/**
 * Generate typescript interface from table schema
 * Created by xiamx on 2016-08-10.
 */

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

export function generateTableInterface(tableNameRaw: string, tableDefinition: TableDefinition, options: Options) {
    const tableName = options.transformTypeName(tableNameRaw);
    let
        selectableMembers = '',
        insertableMembers = '';

    Object.keys(tableDefinition).forEach(columnNameRaw => {
        const
            columnName = options.transformColumnName(columnNameRaw),
            columnDef = tableDefinition[columnNameRaw],
            possiblyOrNull = columnDef.nullable ? ' | null' : '',
            insertablyOptional = columnDef.nullable || columnDef.hasDefault ? '?' : '',
            possiblyOrDefault = columnDef.hasDefault ? ' | DefaultType' : '';

        selectableMembers += `${columnName}: ${columnDef.tsType}${possiblyOrNull};\n`;
        insertableMembers += `${columnName}${insertablyOptional}: ${columnDef.tsType}${possiblyOrNull}${possiblyOrDefault} | SQLFragment;\n`;
    })

    const normalizedTableName = normalizeName(tableName, options);
    return `
        export namespace ${normalizedTableName} {
          export type Table = "${tableName}";
          export interface Selectable {
            ${selectableMembers} }
          export interface Insertable {
            ${insertableMembers} }
          export interface Updatable extends Partial<Insertable> { };
          export type Whereable = { [K in keyof Selectable]?: Selectable[K] | SQLFragment };
          export interface UpsertReturnable extends Selectable, UpsertAction { };
          export type Column = keyof Selectable;
          export type SQLExpression = GenericSQLExpression | Table | Whereable | Column | ColumnNames<Updatable> | ColumnValues<Updatable>;
          export type SQL = SQLExpression | SQLExpression[];
          export interface OrderSpec {
            by: SQL,
            direction: 'ASC' | 'DESC',
            nulls?: 'FIRST' | 'LAST',
          }
          export interface SelectOptions {
            order?: OrderSpec[];
            limit?: number,
            offset?: number,
          }
        }
    `;
}

export function generateEnumType(enumObject: any, options: Options) {
    let enumString = ''
    for (let enumNameRaw in enumObject) {
        const enumName = options.transformTypeName(enumNameRaw)
        enumString += `export type ${enumName} = `
        enumString += enumObject[enumNameRaw].map((v: string) => `'${v}'`).join(' | ')
        enumString += ';\n'
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
