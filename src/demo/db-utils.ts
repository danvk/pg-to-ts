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
    LooseKey3<SchemaT, Table, '$type'>,
    LooseKey3<SchemaT, Table, '$input'>
  > {
    return null as any;
  }

  insertMultiple(): InsertMultiple<
    LooseKey3<SchemaT, Table, '$type'>,
    LooseKey3<SchemaT, Table, '$input'>
  > {
    return null as any;
  }

  update(): Update<LooseKey3<SchemaT, Table, '$type'>> {
    return null as any;
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

type Callable<T> = T extends (...args: any[]) => any
  ? (...args: Parameters<T>) => ReturnType<T>
  : never;

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
    const whereKeys: string[] = [];
    const whereClauses: string[] = [];
    if (this.whereCols) {
      for (const col of this.whereCols as unknown as string[]) {
        whereKeys.push(col);
        const n = whereKeys.length;
        whereClauses.push(`${col} = $${n}`);
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
        whereClauses.push(`${col}::text = ANY($${n})`);
      }
    }
    if (whereClauses.length) {
      query += ` WHERE ${whereClauses}`;
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
    (this as any).cols = cols;
    return this as any;
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
    (this as any).whereCols = cols.filter(col => !isSQLAny(col));
    (this as any).whereAnyCols = cols.filter(col => isSQLAny(col));
    return this as any;
  }

  orderBy(order: OrderBy<keyof TableT>): this {
    this.order = order;
    return this;
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
    (this as any).joinCols = join;
    return this as any;
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
    this.isSingular = true;
    return this as any;
  }
}

// taken from ts-essentials
/** Gets keys of an object which are optional */
export type OptionalKeys<T> = T extends unknown
  ? {
      [K in keyof T]-?: undefined extends {[K2 in keyof T]: K2}[K] ? K : never;
    }[keyof T]
  : never;

interface Insert<TableT, InsertT, DisallowedColumns = never> {
  (
    db: Queryable,
    row: Omit<InsertT, DisallowedColumns & keyof InsertT>,
  ): Promise<TableT>;

  disallowColumns<DisallowedColumns extends OptionalKeys<InsertT>>(
    cols: DisallowedColumns[],
  ): Insert<TableT, InsertT, DisallowedColumns>;

  fn(): Callable<this>;
}

interface InsertMultiple<TableT, InsertT, DisallowedColumns = never> {
  (
    db: Queryable,
    rows: Omit<InsertT, DisallowedColumns & keyof InsertT>[],
  ): Promise<TableT[]>;

  disallowColumns<DisallowedColumns extends OptionalKeys<InsertT>>(
    cols: DisallowedColumns[],
  ): InsertMultiple<TableT, InsertT, DisallowedColumns>;

  fn(): Callable<this>;
}

interface Update<
  TableT,
  WhereCols = null,
  WhereAnyCols = never,
  SetCols = null,
  LimitOne = false,
> {
  (
    db: Queryable,
    where: Resolve<
      LoosePick<TableT, WhereCols> & {
        [K in WhereAnyCols & string]: Set<TableT[K & keyof TableT]>;
      }
    >,
    update: [SetCols] extends [null]
      ? Partial<TableT>
      : LoosePick<TableT, SetCols>,
  ): Promise<LimitOne extends false ? TableT[] : TableT | null>;

  fn(): Callable<this>;

  set<SetCols extends keyof TableT>(
    cols: SetCols[],
  ): Update<TableT, WhereCols, WhereAnyCols, SetCols, LimitOne>;

  where<WhereCols extends keyof TableT | SQLAny<keyof TableT & string>>(
    cols: WhereCols[],
  ): Update<
    TableT,
    Extract<WhereCols, string>,
    WhereCols extends SQLAny<infer C> ? C : never,
    SetCols,
    LimitOne
  >;

  limitOne(): Update<TableT, WhereCols, WhereAnyCols, SetCols, true>;
}
