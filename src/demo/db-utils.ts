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
    );
  }

  // TODO: disallow this method if primaryKey=null
  selectByPrimaryKey(): SelectOne<
    LooseKey<SchemaT, Table>,
    LooseKey3<SchemaT, Table, '$type'>,
    null,
    LooseKey3<SchemaT, Table, 'primaryKey'>
  > {
    return this.select()
      .where([(this.schema[this.tableName] as any).primaryKey])
      .limitOne();
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

class Select<
  TableSchemaT,
  TableT,
  // TODO: remove all the defaults to force them to be set explicitly
  // TODO: maybe keyof TableT would be a more logical default for Cols
  Cols = null,
  WhereCols = never,
  WhereAnyCols = never,
  JoinCols = never,
> {
  private order: OrderBy<keyof TableT> | null;

  constructor(
    private tableSchema: TableSchemaT,
    private table: TableT,
    private cols: Cols,
    private whereCols: WhereCols,
    private whereAnyCols: WhereAnyCols,
    private joinCols: JoinCols,
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
    ? Promise<TableT[]>
    : [Cols] extends [null]
    ? Promise<Array<TableT & Resolve<Join<TableSchemaT, JoinCols>>>>
    : Promise<
        Array<Resolve<LoosePick<TableT, Cols> & Join<TableSchemaT, JoinCols>>>
      > {
    let what: string[] = ['*'];
    if (this.cols) {
      what = this.cols as any;
    }
    const query = `SELECT ${what.join(', ')} FROM ${this.table}`;
    return (db: Queryable, where?: any) => {
      return db.query(query);
    };
  }

  columns<NewCols extends keyof TableT>(
    cols: NewCols[],
  ): Select<TableSchemaT, TableT, NewCols, WhereCols, WhereAnyCols, JoinCols> {
    (this as any).cols = cols;
    return this as any;
  }

  where<WhereCols extends keyof TableT | SQLAny<keyof TableT & string>>(
    cols: WhereCols[],
  ): Select<
    TableSchemaT,
    TableT,
    Cols,
    Extract<WhereCols, string>,
    WhereCols extends SQLAny<infer C> ? C : never,
    JoinCols
  > {
    // TODO: implement
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
    JoinCols | JoinCol
  > {
    (this as any).joinCols = join;
    return this as any;
  }

  limitOne(): SelectOne<TableSchemaT, TableT, Cols, WhereCols, JoinCols> {
    return this as any;
  }
}

// TODO: reduce repetition with Select<>?
// TODO: support WhereAnyCols with SelectOne
interface SelectOne<
  TableSchemaT,
  TableT,
  Cols = null,
  WhereCols = never,
  JoinCols = never,
> {
  (
    ...args: [WhereCols] extends [never]
      ? [db: Queryable]
      : [db: Queryable, where: LoosePick<TableT, WhereCols>]
  ): [Cols, JoinCols] extends [null, never]
    ? Promise<TableT | null>
    : [Cols] extends [null]
    ? Promise<(TableT & Resolve<Join<TableSchemaT, JoinCols>>) | null>
    : Promise<Resolve<
        ([Cols] extends [null] ? TableT : LoosePick<TableT, Cols>) &
          Join<TableSchemaT, JoinCols>
      > | null>;

  fn(): Callable<this>;

  columns<NewCols extends keyof TableT>(
    cols: NewCols[],
  ): SelectOne<TableSchemaT, TableT, NewCols, WhereCols, JoinCols>;

  where<WhereCols extends keyof TableT>(
    cols: WhereCols[],
  ): SelectOne<TableSchemaT, TableT, Cols, WhereCols, JoinCols>;

  orderBy(order: OrderBy<keyof TableT>): this;

  join<JoinCol extends keyof LooseKey<TableSchemaT, 'foreignKeys'>>(
    join: JoinCol,
  ): SelectOne<TableSchemaT, TableT, Cols, WhereCols, JoinCols | JoinCol>;
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
