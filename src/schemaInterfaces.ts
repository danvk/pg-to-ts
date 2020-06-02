import Options from './options'

export interface ForeignKey {
    table: string;
    column: string;
}

export interface ColumnDefinition {
    udtName: string,
    nullable: boolean,
    tsType?: string,
    hasDefault: boolean,
    comment?: string,
    foreignKey?: ForeignKey,
}

export interface TableDefinition {
    columns: {[columnName: string]: ColumnDefinition}
    primaryKey: string | null
    comment?: string;
}

export interface Database {
    connectionString: string
    query (queryString: string): Promise<Object[]>
    getDefaultSchema (): string
    getEnumTypes (schema?: string): any
    getTableDefinition (tableName: string, tableSchema: string, tableToKeys: {[tableName: string]: string}): Promise<TableDefinition>
    getTableTypes (tableName: string, tableSchema: string, tableToKeys: {[tableName: string]: string}, options: Options): Promise<TableDefinition>
    getSchemaTables (schemaName: string): Promise<string[]>
    getPrimaryKeys (schemaName: string): Promise<{[tableName: string]: string}>
}
