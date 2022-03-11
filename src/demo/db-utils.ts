import {tables} from './dbschema';

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
  select(): Select<LooseKey3<SchemaT, Table, '$type'>> {
    const fn = () => {
      return [this.tableName] as any;
    };
    // TODO: implement
    fn.columns = (cols: any[]) => fn;
    fn.where = (cols: any[]) => fn;
    fn.orderBy = (orders: any[]) => fn;
    fn.limitOne = () => fn;
    fn.fn = fn;
    return fn;
  }

  // TODO: disallow this method if primaryKey=null
  selectByPrimaryKey(): SelectOne<
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

type LoosePick<T, K> = Resolve<Pick<T, K & keyof T>>;

// eslint-disable-next-line @typescript-eslint/ban-types
type Resolve<T> = T extends Function ? T : {[K in keyof T]: T[K]};

type Order<Cols> = readonly [column: Cols, order: 'ASC' | 'DESC'];
type OrderBy<Cols> = readonly Order<Cols>[];

type Callable<T> = T extends (...args: any[]) => any
  ? (...args: Parameters<T>) => ReturnType<T>
  : never;

interface Select<TableT, Cols = null, WhereCols = never, WhereAnyCols = never> {
  (
    ...args: [WhereCols, WhereAnyCols] extends [never, never]
      ? [db: Queryable]
      : [
          db: Queryable,
          where: Resolve<
            LoosePick<TableT, WhereCols> & {
              [K in WhereAnyCols & string]: Set<TableT[K & keyof TableT]>;
            }
          >,
        ]
  ): [Cols] extends [null]
    ? Promise<TableT[]>
    : Promise<LoosePick<TableT, Cols>[]>;

  // This helps with display
  fn(): Callable<this>;

  columns<NewCols extends keyof TableT>(
    cols: NewCols[],
  ): Select<TableT, NewCols, WhereCols, WhereAnyCols>;

  where<WhereCols extends keyof TableT | SQLAny<keyof TableT & string>>(
    cols: WhereCols[],
  ): Select<
    TableT,
    Cols,
    Extract<WhereCols, string>,
    WhereCols extends SQLAny<infer C> ? C : never
  >;

  orderBy(order: OrderBy<keyof TableT>): this;

  limitOne(): SelectOne<TableT, Cols, WhereCols>;
}

// TODO: any way to reduce repetition with Select<>?
// TODO: support WhereAnyCols with SelectOne
interface SelectOne<TableT, Cols = null, WhereCols = never> {
  (
    ...args: [WhereCols] extends [never]
      ? [db: Queryable]
      : [db: Queryable, where: LoosePick<TableT, WhereCols>]
  ): [Cols] extends [null]
    ? Promise<TableT | null>
    : Promise<LoosePick<TableT, Cols> | null>;

  fn(): Callable<this>;

  columns<NewCols extends keyof TableT>(
    cols: NewCols[],
  ): SelectOne<TableT, NewCols, WhereCols>;

  where<WhereCols extends keyof TableT>(
    cols: WhereCols[],
  ): SelectOne<TableT, Cols, WhereCols>;

  orderBy(order: OrderBy<keyof TableT>): this;
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
