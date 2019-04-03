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

function normalizeName(name: string, options: Options): string {
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
            selectablyOptional = columnDef.nullable ? '?' : '',
            possiblyOrNull = columnDef.nullable ? ' | null' : '',
            insertablyOptional = columnDef.nullable || columnDef.hasDefault ? '?' : '',
            possiblyOrDefault = columnDef.hasDefault ? ' | DefaultType' : '';

        selectableMembers += `${columnName}${selectablyOptional}: ${columnDef.tsType}${possiblyOrNull};\n`;
        insertableMembers += `${columnName}${insertablyOptional}: ${columnDef.tsType}${possiblyOrNull}${possiblyOrDefault} | SQLFragment;\n`;
    })

    return `
        export namespace ${normalizeName(tableName, options)} {
          export interface Selectable {
            ${selectableMembers}
          }
          export interface Insertable {
            ${insertableMembers}
          }
          export type Table = "${tableName}";

          export type Updatable = Partial<Insertable>;
          export type Whereable = Partial<Selectable>;
          export type Column = keyof Selectable;
          export type SQL = GenericSQL | Table | Whereable | Column;

          export function update(values: Updatable, where: Whereable) { return genericUpdate("${tableName}", values, where); }
          export function insert(values: Insertable) { return genericInsert("${tableName}", values); }
          export function select(where?: Whereable) { return genericSelect("${tableName}", where); }
        }
    `
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
