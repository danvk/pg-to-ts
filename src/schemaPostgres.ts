import PgPromise from 'pg-promise';
import _ from 'lodash';

import Options from './options';
import {
  ColumnDefinition,
  TableDefinition,
  ForeignKey,
} from './schemaInterfaces';

const pgp = PgPromise();

export function pgTypeToTsType(
  column: ColumnDefinition,
  customTypes: string[],
  options: Options,
): string {
  const {udtName} = column;
  switch (udtName) {
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
      return options.options.datesAsStrings ? 'string' : 'Date';
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
      if (customTypes.includes(udtName)) {
        return options.transformTypeName(udtName);
      }
      if (udtName.startsWith('_')) {
        const singularName = udtName.slice(1);
        if (customTypes.includes(singularName)) {
          return options.transformTypeName(singularName) + '[]';
        }
      }
      console.log(
        `Type [${column.udtName} has been mapped to [any] because no specific type has been found.`,
      );
      return 'any';
  }
}

interface Metadata {
  schema: string;
  enumTypes: Record<string, string[]>;
  foreignKeys: {[tableName: string]: {[columnName: string]: ForeignKey}};
  tableToKeys: {[tableName: string]: string};
  columnComments: {[tableName: string]: {[columnName: string]: string}};
  tableComments: {[tableName: string]: string};
}

export class PostgresDatabase {
  db: PgPromise.IDatabase<unknown>;
  metadata: Metadata | null = null;
  connectionString: string;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
    this.db = pgp(connectionString);
  }

  static mapTableDefinitionToType(
    tableDefinition: TableDefinition,
    customTypes: string[],
    options: Options,
  ): TableDefinition {
    return {
      ...tableDefinition,
      columns: _.mapValues(tableDefinition.columns, column => ({
        ...column,
        tsType: pgTypeToTsType(column, customTypes, options),
      })),
    };
  }

  public query(queryString: string) {
    return this.db.query(queryString);
  }

  /** Call this if you know the DB has changed underneath you, e.g. in a test. */
  public reset() {
    this.metadata = null;
  }

  public async getEnumTypes(schema?: string) {
    type T = {name: string; value: string};
    const enums: Record<string, string[]> = {};
    const enumSchemaWhereClause = schema
      ? pgp.as.format(`where n.nspname = $1`, schema)
      : '';
    await this.db.each<T>(
      'select n.nspname as schema, t.typname as name, e.enumlabel as value ' +
        'from pg_type t ' +
        'join pg_enum e on t.oid = e.enumtypid ' +
        'join pg_catalog.pg_namespace n ON n.oid = t.typnamespace ' +
        `${enumSchemaWhereClause} ` +
        'order by t.typname asc, e.enumlabel asc;',
      [],
      (item: T) => {
        if (!enums[item.name]) {
          enums[item.name] = [];
        }
        enums[item.name].push(item.value);
      },
    );
    return enums;
  }

  public async getTableDefinition(tableName: string, tableSchema: string) {
    const {tableToKeys, columnComments, tableComments, foreignKeys} =
      await this.getMeta(tableSchema);

    const tableDefinition: TableDefinition = {
      columns: {},
      primaryKey: tableToKeys[tableName] || null,
    };
    const tableComment = tableComments[tableName];
    if (tableComment) {
      tableDefinition.comment = tableComment;
    }
    type T = {
      column_name: string;
      udt_name: string;
      is_nullable: string;
      has_default: boolean;
    };
    const comments = columnComments[tableName] || {};
    const fkeys = foreignKeys[tableName] || {};

    await this.db.each<T>(
      'SELECT column_name, udt_name, is_nullable, column_default IS NOT NULL as has_default ' +
        'FROM information_schema.columns ' +
        'WHERE table_name = $1 and table_schema = $2',
      [tableName, tableSchema],
      (schemaItem: T) => {
        const {column_name} = schemaItem;
        const columnComment = comments[column_name];
        const foreignKey = fkeys[column_name];
        tableDefinition.columns[column_name] = {
          udtName: schemaItem.udt_name,
          nullable: schemaItem.is_nullable === 'YES',
          hasDefault: schemaItem.has_default === true,
          ...(columnComment ? {comment: columnComment} : {}),
          ...(foreignKey ? {foreignKey} : {}),
        };
      },
    );
    return tableDefinition;
  }

  public async getTableTypes(
    tableName: string,
    tableSchema: string,
    options: Options,
  ) {
    const {enumTypes} = await this.getMeta(tableSchema);
    const customTypes = _.keys(enumTypes);
    return PostgresDatabase.mapTableDefinitionToType(
      await this.getTableDefinition(tableName, tableSchema),
      customTypes,
      options,
    );
  }

  public async getSchemaTables(schemaName: string): Promise<string[]> {
    return this.db.map<string>(
      'SELECT table_name ' +
        'FROM information_schema.columns ' +
        'WHERE table_schema = $1 ' +
        'GROUP BY table_name ORDER BY lower(table_name)',
      [schemaName],
      (schemaItem: {table_name: string}) => schemaItem.table_name,
    );
  }

  public async getPrimaryKeys(schemaName: string) {
    interface PrimaryKeyDefinition {
      table_name: string;
      constraint_name: string;
      ordinal_position: number;
      key_column: string;
    }

    // https://dataedo.com/kb/query/postgresql/list-all-primary-keys-and-their-columns
    const keys: PrimaryKeyDefinition[] = await this.db.query(
      `
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
        `,
      [schemaName],
    );

    return _(keys)
      .groupBy(k => k.table_name)
      .mapValues(keysForTable => keysForTable[0].key_column)
      .value();
  }

  public async getColumnComments(schemaName: string) {
    interface ColumnComment {
      table_name: string;
      column_name: string;
      description: string;
    }

    // See https://stackoverflow.com/a/4946306/388951
    const comments: ColumnComment[] = await this.db.query(
      `
            SELECT
                c.table_name,
                c.column_name,
                pgd.description
            FROM pg_catalog.pg_statio_all_tables AS st
            INNER JOIN pg_catalog.pg_description pgd ON (pgd.objoid=st.relid)
            INNER JOIN information_schema.columns c ON (
                pgd.objsubid=c.ordinal_position AND
                c.table_schema=st.schemaname AND
                c.table_name=st.relname
            )
            WHERE c.table_schema = $1;
        `,
      [schemaName],
    );

    return _(comments)
      .groupBy(c => c.table_name)
      .mapValues(ct =>
        _.fromPairs(
          ct.map(({column_name, description}) => [column_name, description]),
        ),
      )
      .value();
  }

  public async getTableComments(schemaName: string) {
    interface TableComment {
      table_name: string;
      description: string;
    }
    const comments: TableComment[] = await this.db.query(
      `
            SELECT
                t.table_name,
                pgd.description
            FROM pg_catalog.pg_statio_all_tables AS st
            INNER JOIN pg_catalog.pg_description pgd ON (pgd.objoid=st.relid)
            INNER JOIN information_schema.tables t ON (
                t.table_schema=st.schemaname AND
                t.table_name=st.relname
            )
            WHERE pgd.objsubid = 0
              AND t.table_schema = $1;
        `,
      [schemaName],
    );

    return _.fromPairs(comments.map(c => [c.table_name, c.description]));
  }

  async getForeignKeys(schemaName: string) {
    interface ForeignKey {
      table_name: string;
      column_name: string;
      foreign_table_name: string;
      foreign_column_name: string;
      conname: string;
    }
    // See https://stackoverflow.com/a/10950402/388951
    const fkeys: ForeignKey[] = await this.db.query(
      `
        SELECT
            cl2.relname AS table_name,
            att2.attname AS column_name,
            cl.relname AS foreign_table_name,
            att.attname AS foreign_column_name,
            conname
        FROM
            (SELECT
                unnest(con1.conkey) AS "parent",
                unnest(con1.confkey) AS "child",
                con1.confrelid,
                con1.conrelid,
                con1.conname
            FROM pg_class cl
            JOIN pg_namespace ns ON cl.relnamespace = ns.oid
            JOIN pg_constraint con1 ON con1.conrelid = cl.oid
            WHERE ns.nspname = $1 AND con1.contype = 'f'
            ) con
        JOIN pg_attribute att ON att.attrelid = con.confrelid and att.attnum = con.child
        JOIN pg_class cl ON cl.oid = con.confrelid
        JOIN pg_class cl2 ON cl2.oid = con.conrelid
        JOIN pg_attribute att2 ON att2.attrelid = con.conrelid AND att2.attnum = con.parent
        `,
      [schemaName],
    );

    // Multi-column foreign keys are harder to model.
    // To get consistent outputs, just ignore them for now.
    const countKey = (fk: ForeignKey) => `${fk.table_name},${fk.conname}`;
    const colCounts = _.countBy(fkeys, countKey);

    return _(fkeys)
      .filter(c => colCounts[countKey(c)] < 2)
      .groupBy(c => c.table_name)
      .mapValues(tks =>
        _.fromPairs(
          tks.map(ck => [
            ck.column_name,
            {table: ck.foreign_table_name, column: ck.foreign_column_name},
          ]),
        ),
      )
      .value();
  }

  async getMeta(schemaName: string): Promise<Metadata> {
    if (this.metadata && schemaName === this.metadata.schema) {
      return this.metadata;
    }

    const [enumTypes, tableToKeys, foreignKeys, columnComments, tableComments] =
      await Promise.all([
        this.getEnumTypes(),
        this.getPrimaryKeys(schemaName),
        this.getForeignKeys(schemaName),
        this.getColumnComments(schemaName),
        this.getTableComments(schemaName),
      ]);

    const metadata: Metadata = {
      schema: schemaName,
      enumTypes,
      tableToKeys,
      foreignKeys,
      columnComments,
      tableComments,
    };

    this.metadata = metadata;
    return metadata;
  }

  getDefaultSchema(): string {
    return 'public';
  }
}
