/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Queryable {
  query(...args: any[]): any;
}

export class TypedSQL<SchemaT> {
  schema: SchemaT;
  constructor(schema: SchemaT) {
    this.schema = schema;
  }

  table<Table extends keyof SchemaT>(
    tableName: Table,
  ): TableBuilder<SchemaT, Table> {
    return new TableBuilder<SchemaT, Table>(this.schema, tableName);
  }
}

export class TableBuilder<SchemaT, Table extends keyof SchemaT> {
  schema: SchemaT;
  tableName: keyof SchemaT;
  constructor(schema: SchemaT, tableName: keyof SchemaT) {
    this.schema = schema;
    this.tableName = tableName;
  }

  // TODO: this should optionally take the list of columns to mirror SQL
  select() {
    return new Select<
      LooseKey<SchemaT, Table>,
      LooseKey3<SchemaT, Table, '$type'>
    >(
      (this.schema as any)[this.tableName],
      this.tableName as any,
      null,
      null!,
      null!,
      null!,
      false,
    );
  }

  // TODO: disallow this method if primaryKey=null
  selectByPrimaryKey(): Select<
    LooseKey<SchemaT, Table>,
    LooseKey3<SchemaT, Table, '$type'>,
    null,
    LooseKey3<SchemaT, Table, 'primaryKey'>,
    never,
    never,
    true
  > {
    return this.select()
      .where([(this.schema[this.tableName] as any).primaryKey])
      .limitOne() as any;
  }

  insert(): Insert<
    LooseKey<SchemaT, Table>,
    LooseKey3<SchemaT, Table, '$type'>,
    LooseKey3<SchemaT, Table, '$input'>
  > {
    return new Insert(
      (this.schema as any)[this.tableName],
      this.tableName as any,
      null,
    ) as any;
  }

  insertMultiple(): InsertMultiple<
    LooseKey<SchemaT, Table>,
    LooseKey3<SchemaT, Table, '$type'>,
    LooseKey3<SchemaT, Table, '$input'>
  > {
    return new InsertMultiple(
      (this.schema as any)[this.tableName],
      this.tableName as any,
      null,
    ) as any;
  }

  update(): Update<LooseKey3<SchemaT, Table, '$type'>> {
    return new Update(this.tableName as any, null, null, null, false) as any;
  }

  updateByPrimaryKey(): Update<
    LooseKey3<SchemaT, Table, '$type'>,
    LooseKey3<SchemaT, Table, 'primaryKey'>,
    never,
    null,
    true
  > {
    return this.update()
      .where([(this.schema[this.tableName] as any).primaryKey])
      .limitOne() as any;
  }

  delete(): Delete<LooseKey3<SchemaT, Table, '$type'>> {
    return new Delete(this.tableName as any, null, null, false) as any;
  }

  deleteByPrimaryKey(): Delete<
    LooseKey3<SchemaT, Table, '$type'>,
    LooseKey3<SchemaT, Table, 'primaryKey'>
  > {
    return this.delete()
      .where([(this.schema[this.tableName] as any).primaryKey])
      .limitOne() as any;
  }
}

type SQLAny<C extends string> = {
  __any: C;
};

export function any<C extends string>(column: C): SQLAny<C> {
  return {__any: column};
}

function isSQLAny(v: unknown): v is SQLAny<string> {
  return !!v && typeof v === 'object' && '__any' in v;
}

type LooseKey<T, K> = T[K & keyof T];
type LooseKey3<T, K1, K2> = LooseKey<LooseKey<T, K1>, K2>;
type LooseKey4<T, K1, K2, K3> = LooseKey<LooseKey3<T, K1, K2>, K3>;

type LoosePick<T, K> = Resolve<Pick<T, K & keyof T>>;

// eslint-disable-next-line @typescript-eslint/ban-types
type Resolve<T> = T extends Function ? T : {[K in keyof T]: T[K]};

type Order<Cols> = readonly [column: Cols, order: 'ASC' | 'DESC'];
type OrderBy<Cols> = readonly Order<Cols>[];

// This simplifies some definitions, but makes the display less clear.
// Using Resolve<SetOrArray<T>> also resolves the Set<T> :(
// type SetOrArray<T> = readonly T[] | Set<T>;

type Join<TableSchemaT, JoinCols> = {
  [K in JoinCols as LooseKey4<TableSchemaT, 'foreignKeys', K, 'table'> &
    string]: LooseKey4<TableSchemaT, 'foreignKeys', K, '$type'>;
};

type Result<T, IsSingular> = IsSingular extends true ? T | null : T[];

class Select<
  TableSchemaT,
  TableT,
  // TODO: remove all the defaults to force them to be set explicitly
  // TODO: maybe keyof TableT would be a more logical default for Cols
  Cols = null,
  WhereCols = never,
  WhereAnyCols = never,
  JoinCols = never,
  IsSingular = false,
> {
  private order: OrderBy<keyof TableT> | null;

  constructor(
    private tableSchema: TableSchemaT,
    private table: TableT,
    private cols: Cols,
    private whereCols: WhereCols,
    private whereAnyCols: WhereAnyCols,
    private joinCols: JoinCols,
    private isSingular: boolean,
  ) {
    this.order = null;
  }

  clone(): this {
    const clone = new Select(
      this.tableSchema,
      this.table,
      this.cols,
      this.whereCols,
      this.whereAnyCols,
      this.joinCols,
      this.isSingular,
    );
    clone.order = this.order;
    return clone as any;
  }

  fn(): (
    ...args: [WhereCols, WhereAnyCols] extends [never, never]
      ? [db: Queryable]
      : [
          db: Queryable,
          where: Resolve<
            LoosePick<TableT, WhereCols> & {
              [K in WhereAnyCols & string]:
                | readonly TableT[K & keyof TableT][]
                | Set<TableT[K & keyof TableT]>;
            }
          >,
        ]
  ) => [Cols, JoinCols] extends [null, never]
    ? Promise<Result<TableT, IsSingular>>
    : [Cols] extends [null]
    ? Promise<
        Result<TableT & Resolve<Join<TableSchemaT, JoinCols>>, IsSingular>
      >
    : Promise<
        Result<
          Resolve<LoosePick<TableT, Cols> & Join<TableSchemaT, JoinCols>>,
          IsSingular
        >
      > {
    let what: string[] = ['*'];
    if (this.cols) {
      what = this.cols as any;
    }
    let query = `SELECT ${what.join(', ')} FROM ${this.table}`;
    let joins: string[] = [];
    if (this.joinCols) {
      const joinCols = this.joinCols as unknown as string[];
      const otherTables = joinCols.map(
        col => (this.tableSchema as any).foreignKeys[col].table,
      );
      query = `SELECT ${what.map(c => `t1.${c}`).join(', ')}, `;
      query += otherTables
        .map((t, i) => `to_jsonb(t${i + 2}.*) as ${t}`)
        .join(', ');
      query += ` FROM ${this.table} as t1`;

      joins = joinCols.map((col, i) => {
        const fkey = (this.tableSchema as any).foreignKeys[col];
        const n = i + 2;
        return ` JOIN ${fkey.table} AS t${n} ON t1.${col} = t${n}.${fkey.column}`;
      });
      query += joins.join('');
    }
    const whereKeys: string[] = [];
    const whereClauses: string[] = [];
    const tab = this.joinCols ? 't1.' : '';
    if (this.whereCols) {
      for (const col of this.whereCols as unknown as string[]) {
        whereKeys.push(col);
        const n = whereKeys.length;
        whereClauses.push(`${tab}${col} = $${n}`);
      }
    }
    if (this.whereAnyCols) {
      for (const anyCol of this.whereAnyCols as unknown as SQLAny<string>[]) {
        const col = anyCol.__any;
        whereKeys.push(col);
        const n = whereKeys.length;
        // XXX this is weird; pg-promise is OK to select UUID columns w/ strings,
        //     but not to compare them using ANY(). node-postgres seems OK though.
        //     If this is truly needed, it should at least be conditional.
        whereClauses.push(`${tab}${col}::text = ANY($${n})`);
      }
    }
    if (whereClauses.length) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    if (this.order) {
      const orderClause = this.order.map(([col, dir]) => `${col} ${dir}`);
      query += ` ORDER BY ${orderClause}`;
    }
    return async (db: Queryable, whereObj?: any) => {
      const where = whereKeys.map(col =>
        whereObj[col] instanceof Set
          ? Array.from(whereObj[col])
          : whereObj[col],
      );
      const result = await db.query(query, where);
      if (this.isSingular) {
        if (result.length === 0) {
          return null;
        } else if (result.length === 1) {
          return result[0];
        }
        // TODO: is it helpful or harmful to add a LIMIT 1 to the query?
        throw new Error('Got multiple results for singular query');
      }
      return result;
    };
  }

  columns<NewCols extends keyof TableT>(
    cols: NewCols[],
  ): Select<
    TableSchemaT,
    TableT,
    NewCols,
    WhereCols,
    WhereAnyCols,
    JoinCols,
    IsSingular
  > {
    const clone = this.clone();
    (clone as any).cols = cols;
    return clone as any;
  }

  // XXX: should this be varargs?
  where<WhereCols extends keyof TableT | SQLAny<keyof TableT & string>>(
    cols: WhereCols[],
  ): Select<
    TableSchemaT,
    TableT,
    Cols,
    Extract<WhereCols, string>,
    WhereCols extends SQLAny<infer C> ? C : never,
    JoinCols,
    IsSingular
  > {
    const clone = this.clone();
    (clone as any).whereCols = cols.filter(col => !isSQLAny(col));
    (clone as any).whereAnyCols = cols.filter(col => isSQLAny(col));
    return clone as any;
  }

  orderBy(order: OrderBy<keyof TableT>): this {
    const clone = this.clone();
    clone.order = order;
    return clone;
  }

  join<
    JoinCol extends Exclude<
      keyof LooseKey<TableSchemaT, 'foreignKeys'>,
      JoinCols
    >,
  >(
    join: JoinCol,
  ): Select<
    TableSchemaT,
    TableT,
    Cols,
    WhereCols,
    WhereAnyCols,
    JoinCols | JoinCol,
    IsSingular
  > {
    const clone = this.clone();
    (clone as any).joinCols = ((this as any).joinCols ?? []).concat(join);
    return clone as any;
  }

  limitOne(): Select<
    TableSchemaT,
    TableT,
    Cols,
    WhereCols,
    WhereAnyCols,
    JoinCols,
    true
  > {
    const clone = this.clone();
    (clone as any).isSingular = true;
    return clone as any;
  }
}

// taken from ts-essentials
/** Gets keys of an object which are optional */
export type OptionalKeys<T> = T extends unknown
  ? {
      [K in keyof T]-?: undefined extends {[K2 in keyof T]: K2}[K] ? K : never;
    }[keyof T]
  : never;

class Insert<TableSchemaT, TableT, InsertT, DisallowedColumns = never> {
  constructor(
    private tableSchema: TableSchemaT,
    private table: string,
    private disallowedColumns: DisallowedColumns,
  ) {}

  clone(): this {
    return new Insert(
      this.tableSchema,
      this.table,
      this.disallowedColumns,
    ) as any;
  }

  fn(): (
    db: Queryable,
    row: Omit<InsertT, DisallowedColumns & keyof InsertT>,
  ) => Promise<TableT> {
    // TODO: define an interface for this
    const allColumns = (this.tableSchema as any).columns as string[];
    const disallowedColumns = this.disallowedColumns as unknown as
      | string[]
      | null;
    const allowedColumns = disallowedColumns
      ? allColumns.filter(col => !disallowedColumns.includes(col))
      : allColumns;

    return (async (db: Queryable, obj: any) => {
      if (disallowedColumns) {
        const illegalCols = disallowedColumns.filter(
          col => obj[col] !== undefined,
        );
        if (illegalCols.length > 0) {
          throw new Error(`Cannot insert disallowed column(s) ${illegalCols}`);
        }
      }
      const keys = allowedColumns.filter(col => obj[col] !== undefined);
      const placeholders = keys.map((_col, i) => `$${i + 1}`);
      // TODO: quoting for table / column names everywhere
      const colsSql = keys.join(', ');
      const placeholderSql = placeholders.join(', ');
      const query = `INSERT INTO ${this.table}(${colsSql}) VALUES (${placeholderSql}) RETURNING *`;

      const vals = keys.map(col => obj[col]);
      const result = await db.query(query, vals);
      if (result.length === 0) {
        return null; // should be an error?
      }
      return result[0];
    }) as any;
  }

  disallowColumns<DisallowedColumns extends OptionalKeys<InsertT>>(
    cols: DisallowedColumns[],
  ): Insert<TableSchemaT, TableT, InsertT, DisallowedColumns> {
    const clone = this.clone();
    (clone as any).disallowedColumns = cols;
    return clone as any;
  }
}

class InsertMultiple<TableSchemaT, TableT, InsertT, DisallowedColumns = never> {
  constructor(
    private tableSchema: TableSchemaT,
    private table: string,
    private disallowedColumns: DisallowedColumns,
  ) {}

  clone(): this {
    return new InsertMultiple(
      this.tableSchema,
      this.table,
      this.disallowedColumns,
    ) as any;
  }

  fn(): (
    db: Queryable,
    rows: Omit<InsertT, DisallowedColumns & keyof InsertT>[],
  ) => Promise<InsertT[]> {
    const allColumns = (this.tableSchema as any).columns as string[];
    const disallowedColumns = this.disallowedColumns as unknown as
      | string[]
      | null;
    const allowedColumns = disallowedColumns
      ? allColumns.filter(col => !disallowedColumns.includes(col))
      : allColumns;

    return (async (db: Queryable, rows: any[]) => {
      if (disallowedColumns) {
        const illegalCols = disallowedColumns.filter(col =>
          rows.some(row => row[col] !== undefined),
        );
        if (illegalCols.length > 0) {
          throw new Error(`Cannot insert disallowed column(s) ${illegalCols}`);
        }
      }
      const keys = allowedColumns.filter(col => rows[0][col] !== undefined);
      const colsSql = keys.join(', ');
      let placeholder = 1;
      const insertSqls = [];
      let vals: any[] = [];
      for (const row of rows) {
        insertSqls.push(
          '(' + keys.map((_col, i) => `$${placeholder + i}`).join(',') + ')',
        );
        placeholder += keys.length;
        vals = vals.concat(keys.map(k => row[k]));
      }
      // TODO: quoting for table / column names everywhere
      const placeholderSql = insertSqls.join(', ');
      // TODO: some ability to control 'returning' would be especially useful here.
      const query = `INSERT INTO ${this.table}(${colsSql}) VALUES ${placeholderSql} RETURNING *`;

      console.log(query, vals);
      return db.query(query, vals);
    }) as any;
  }

  disallowColumns<DisallowedColumns extends OptionalKeys<InsertT>>(
    cols: DisallowedColumns[],
  ): InsertMultiple<TableSchemaT, TableT, InsertT, DisallowedColumns> {
    const clone = this.clone();
    clone.disallowedColumns = cols as any;
    return clone as any;
  }
}

class Update<
  TableT,
  WhereCols = null,
  WhereAnyCols = never,
  SetCols = null,
  LimitOne = false,
> {
  constructor(
    private table: TableT,
    private whereCols: WhereCols,
    private whereAnyCols: WhereAnyCols,
    private setCols: SetCols,
    private isSingular: LimitOne,
  ) {}

  clone(): this {
    return new Update(
      this.table,
      this.whereCols,
      this.whereAnyCols,
      this.setCols,
      this.isSingular,
    ) as any;
  }

  fn(): (
    db: Queryable,
    where: Resolve<
      LoosePick<TableT, WhereCols> & {
        [K in WhereAnyCols & string]:
          | Set<TableT[K & keyof TableT]>
          | readonly TableT[K & keyof TableT][];
      }
    >,
    update: [SetCols] extends [null]
      ? Partial<TableT>
      : LoosePick<TableT, SetCols>,
  ) => Promise<LimitOne extends false ? TableT[] : TableT | null> {
    let placeholder = 1;
    const setKeys: string[] = [];
    const setClauses: string[] = [];
    const setCols = this.setCols as unknown as string[] | null;
    if (setCols) {
      for (const col of setCols) {
        setKeys.push(col);
        const n = placeholder++;
        setClauses.push(`SET ${col} = $${n}`);
      }
    }

    const whereKeys: string[] = [];
    const whereClauses: string[] = [];
    if (this.whereCols) {
      for (const col of this.whereCols as unknown as string[]) {
        whereKeys.push(col);
        const n = placeholder++;
        whereClauses.push(`${col} = $${n}`);
      }
    }
    if (this.whereAnyCols) {
      for (const anyCol of this.whereAnyCols as unknown as SQLAny<string>[]) {
        const col = anyCol.__any;
        whereKeys.push(col);
        const n = placeholder++;
        // XXX this is weird; pg-promise is OK to select UUID columns w/ strings,
        //     but not to compare them using ANY(). node-postgres seems OK though.
        //     If this is truly needed, it should at least be conditional.
        whereClauses.push(`${col}::text = ANY($${n})`);
      }
    }
    const whereClause = whereClauses.length
      ? ` WHERE ${whereClauses.join(' AND ')}`
      : '';

    const limitClause = this.isSingular ? ' LIMIT 1' : '';

    if (setCols) {
      // In this case the query can be determined in advance
      const query = setCols
        ? `UDPATE ${this.table} ${setClauses.join(
            ' ',
          )}${whereClause}${limitClause} RETURNING *`
        : null;

      return async (db, whereObj: any, updateObj: any) => {
        const vals = setCols
          .map(col => updateObj[col])
          .concat(
            whereKeys.map(col =>
              whereObj[col] instanceof Set
                ? Array.from(whereObj[col])
                : whereObj[col],
            ),
          );
        const result = await db.query(query, vals);
        if (this.isSingular) {
          return result.length === 0 ? null : result[0];
        }
        return result;
      };
    }

    // In this case the query is dynamic.
    // TODO: reduce duplication here, the code paths are pretty similar.
    return async (db, whereObj: any, updateObj: any) => {
      // TODO: maybe better to get this from the schema?
      const setCols = Object.keys(updateObj);
      const vals = whereKeys
        .map(col =>
          whereObj[col] instanceof Set
            ? Array.from(whereObj[col])
            : whereObj[col],
        )
        .concat(setCols.map(col => updateObj[col]));
      for (const col of setCols) {
        setKeys.push(col);
        const n = placeholder++;
        setClauses.push(`SET ${col} = $${n}`);
      }
      const query = setCols
        ? `UDPATE ${this.table} ${setClauses.join(
            ' ',
          )}${whereClause}${limitClause} RETURNING *`
        : null;
      const result = await db.query(query, vals);
      if (this.isSingular) {
        return result.length === 0 ? null : result[0];
      }
      return result;
    };
  }

  set<SetCols extends keyof TableT>(
    cols: SetCols[],
  ): Update<TableT, WhereCols, WhereAnyCols, SetCols, LimitOne> {
    const clone = this.clone();
    clone.setCols = cols as any;
    return clone as any;
  }

  where<WhereCols extends keyof TableT | SQLAny<keyof TableT & string>>(
    cols: WhereCols[],
  ): Update<
    TableT,
    Extract<WhereCols, string>,
    WhereCols extends SQLAny<infer C> ? C : never,
    SetCols,
    LimitOne
  > {
    const clone = this.clone();
    (clone as any).whereCols = cols.filter(col => !isSQLAny(col));
    (clone as any).whereAnyCols = cols.filter(col => isSQLAny(col));
    return clone as any;
  }

  limitOne(): Update<TableT, WhereCols, WhereAnyCols, SetCols, true> {
    const clone = this.clone();
    (clone as any).isSingular = true;
    return clone as any;
  }
}

class Delete<TableT, WhereCols = null, WhereAnyCols = never, LimitOne = false> {
  constructor(
    private table: TableT,
    private whereCols: WhereCols,
    private whereAnyCols: WhereAnyCols,
    private isSingular: LimitOne,
  ) {}

  clone(): this {
    return new Delete(
      this.table,
      this.whereCols,
      this.whereAnyCols,
      this.isSingular,
    ) as any;
  }

  fn(): (
    db: Queryable,
    where: Resolve<
      LoosePick<TableT, WhereCols> & {
        [K in WhereAnyCols & string]:
          | Set<TableT[K & keyof TableT]>
          | readonly TableT[K & keyof TableT][];
      }
    >,
  ) => Promise<LimitOne extends false ? TableT[] : TableT | null> {
    let placeholder = 1;

    const whereKeys: string[] = [];
    const whereClauses: string[] = [];
    if (this.whereCols) {
      for (const col of this.whereCols as unknown as string[]) {
        whereKeys.push(col);
        const n = placeholder++;
        whereClauses.push(`${col} = $${n}`);
      }
    }
    if (this.whereAnyCols) {
      for (const anyCol of this.whereAnyCols as unknown as SQLAny<string>[]) {
        const col = anyCol.__any;
        whereKeys.push(col);
        const n = placeholder++;
        // XXX this is weird; pg-promise is OK to select UUID columns w/ strings,
        //     but not to compare them using ANY(). node-postgres seems OK though.
        //     If this is truly needed, it should at least be conditional.
        whereClauses.push(`${col}::text = ANY($${n})`);
      }
    }
    const whereClause = whereClauses.length
      ? ` WHERE ${whereClauses.join(' AND ')}`
      : '';

    const limitClause = this.isSingular ? ' LIMIT 1' : '';

    const query = `DELETE FROM ${this.table}${whereClause}${limitClause} RETURNING *`;

    return async (db, whereObj: any) => {
      const vals = whereKeys.map(col =>
        whereObj[col] instanceof Set
          ? Array.from(whereObj[col])
          : whereObj[col],
      );
      const result = await db.query(query, vals);
      if (this.isSingular) {
        return result.length === 0 ? null : result[0];
      }
      return result;
    };
  }

  where<WhereCols extends keyof TableT | SQLAny<keyof TableT & string>>(
    cols: WhereCols[],
  ): Delete<
    TableT,
    Extract<WhereCols, string>,
    WhereCols extends SQLAny<infer C> ? C : never,
    LimitOne
  > {
    const clone = this.clone();
    (clone as any).whereCols = cols.filter(col => !isSQLAny(col));
    (clone as any).whereAnyCols = cols.filter(col => isSQLAny(col));
    return clone as any;
  }

  limitOne(): Delete<TableT, WhereCols, WhereAnyCols, true> {
    const clone = this.clone();
    (clone as any).isSingular = true;
    return clone as any;
  }
}
