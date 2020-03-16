import * as PgPromise from 'pg-promise'
import * as _ from 'lodash'

import Options from './options'
import { ColumnDefinition, TableDefinition, Database } from './schemaInterfaces'

const pgp = PgPromise()

function pgTypeToTsType (column: ColumnDefinition, customTypes: string[], options: Options): string {
    switch (column.udtName) {
        case 'bpchar':
        case 'char':
        case 'varchar':
        case 'text':
        case 'citext':
        case 'uuid':
        case 'bytea':
        case 'inet':
        case 'time':
        case 'timetz':
        case 'interval':
        case 'name':
            return 'string';
        case 'int2':
        case 'int4':
        case 'int8':
        case 'float4':
        case 'float8':
        case 'numeric':
        case 'money':
        case 'oid':
            return 'number';
        case 'bool':
            return 'boolean';
        case 'json':
        case 'jsonb':
            return 'Json';
        case 'date':
        case 'timestamp':
        case 'timestamptz':
            return 'Date';
        case '_int2':
        case '_int4':
        case '_int8':
        case '_float4':
        case '_float8':
        case '_numeric':
        case '_money':
            return 'number[]';
        case '_bool':
            return 'boolean[]';
        case '_varchar':
        case '_text':
        case '_citext':
        case '_uuid':
        case '_bytea':
            return 'string[]';
        case '_json':
        case '_jsonb':
            return 'Json[]';
        case '_timestamptz':
            return 'Date[]';
        default:
            if (customTypes.indexOf(column.udtName) !== -1) {
                return options.transformTypeName(column.udtName);
            }
            console.log(`Type [${column.udtName} has been mapped to [any] because no specific type has been found.`);
            return 'any';
    }
}

export class PostgresDatabase implements Database {
    private db: PgPromise.IDatabase<{}>

    constructor (public connectionString: string) {
        this.db = pgp(connectionString)
    }

    private static mapTableDefinitionToType (tableDefinition: TableDefinition, customTypes: string[], options: Options): TableDefinition {
        return {
            ...tableDefinition,
            columns:
            _.mapValues(tableDefinition.columns, column => ({
                ...column,
                tsType: pgTypeToTsType(column, customTypes, options)
            }))
        }
    }

    public query (queryString: string) {
        return this.db.query(queryString)
    }

    public async getEnumTypes (schema?: string) {
        type T = {name: string, value: any}
        let enums: any = {}
        let enumSchemaWhereClause = schema ? pgp.as.format(`where n.nspname = $1`, schema) : ''
        await this.db.each<T>(
             'select n.nspname as schema, t.typname as name, e.enumlabel as value ' +
             'from pg_type t ' +
             'join pg_enum e on t.oid = e.enumtypid ' +
             'join pg_catalog.pg_namespace n ON n.oid = t.typnamespace ' +
             `${enumSchemaWhereClause} ` +
             'order by t.typname asc, e.enumlabel asc;', [],
            (item: T) => {
                if (!enums[item.name]) {
                    enums[item.name] = []
                }
                enums[item.name].push(item.value)
            }
        )
        return enums
    }

    public async getTableDefinition (tableName: string, tableSchema: string, tableToKeys: {[tableName: string]: string[]}) {
        let tableDefinition: TableDefinition = {
            columns: {},
            primaryKeys: tableToKeys[tableName] || []
        }
        type T = { column_name: string, udt_name: string, is_nullable: string, has_default: boolean };

        await this.db.each<T>(
            'SELECT column_name, udt_name, is_nullable, column_default IS NOT NULL as has_default ' +
            'FROM information_schema.columns ' +
            'WHERE table_name = $1 and table_schema = $2',
            [tableName, tableSchema],
            (schemaItem: T) => {
                tableDefinition.columns[schemaItem.column_name] = {
                    udtName: schemaItem.udt_name,
                    nullable: schemaItem.is_nullable === 'YES',
                    hasDefault: schemaItem.has_default === true
                }
            })
        return tableDefinition
    }

    public async getTableTypes (
        tableName: string,
        tableSchema: string,
        tableToKeys: {[tableName: string]: string[]},
        options: Options) {
        let enumTypes = await this.getEnumTypes()
        let customTypes = _.keys(enumTypes)
        return PostgresDatabase.mapTableDefinitionToType(
            await this.getTableDefinition(tableName, tableSchema, tableToKeys), customTypes, options
        )
    }

    public async getSchemaTables (schemaName: string): Promise<string[]> {
        return this.db.map<string>(
            'SELECT table_name ' +
            'FROM information_schema.columns ' +
            'WHERE table_schema = $1 ' +
            'GROUP BY table_name ORDER BY lower(table_name)',
            [schemaName],
            (schemaItem: {table_name: string}) => schemaItem.table_name
        )
    }

    public async getPrimaryKeys (schemaName: string) {
        interface PrimaryKeyDefinition {
            table_name: string
            constraint_name: string
            ordinal_position: number
            key_column: string
        }

        const keys: PrimaryKeyDefinition[] = await this.db.query(`
            SELECT
                kcu.table_name,
                tco.constraint_name,
                kcu.ordinal_position as position,
                kcu.column_name as key_column
            FROM information_schema.table_constraints tco
            JOIN information_schema.key_column_usage kcu
                on kcu.constraint_name = tco.constraint_name
                and kcu.constraint_schema = tco.constraint_schema
                and kcu.constraint_name = tco.constraint_name
            WHERE tco.constraint_type = 'PRIMARY KEY'
              AND kcu.table_schema = $1
            ORDER BY kcu.table_name,
                     position;
        `, [schemaName])

        return _(keys)
            .groupBy(k => k.table_name)
            .mapValues(keysForTable =>
                _(keysForTable)
                .sortBy(k => k.ordinal_position)
                .map(k => k.key_column)
                .value()
            )
            .value()
    }

    getDefaultSchema (): string {
        return 'public'
    }
}
