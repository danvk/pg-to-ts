import {tables} from './dbschema';

class TypedSQL<SchemaT> {
  schema: SchemaT;
  constructor(schema: SchemaT) {
    this.schema = schema;
  }

  select<Table extends keyof SchemaT>(
    tableName: Table,
  ): Select<LooseKey3<SchemaT, Table, '$type'>> {
    const fn = () => {
      return [tableName] as any;
    };
    // TODO: implement
    fn.columns = (cols: any[]) => fn;
    fn.where = (cols: any[]) => fn;
    fn.orderBy = (orders: any[]) => fn;
    fn.limitOne = () => fn;
    return fn;
  }

  // TODO: disallow this method if primaryKey=null
  selectByPrimaryKey<Table extends keyof SchemaT>(
    tableName: Table,
  ): SelectOne<
    LooseKey3<SchemaT, Table, '$type'>,
    null,
    LooseKey3<SchemaT, Table, 'primaryKey'>
  > {
    return this.select(tableName)
      .where([(this.schema[tableName] as any).primaryKey])
      .limitOne();
  }
}

type SQLAny<C extends string> = {
  __any: C;
};

function any<C extends string>(column: C): SQLAny<C> {
  return {__any: column};
}

type LooseKey<T, K> = T[K & keyof T];
type LooseKey3<T, K1, K2> = LooseKey<LooseKey<T, K1>, K2>;
type LooseKey4<T, K1, K2, K3> = LooseKey<LooseKey3<T, K1, K2>, K3>;

type LoosePick<T, K> = SimplifyType<Pick<T, K & keyof T>>;

// eslint-disable-next-line @typescript-eslint/ban-types
type SimplifyType<T> = T extends Function ? T : {[K in keyof T]: T[K]};

type Order<Cols> = [column: Cols, order: 'ASC' | 'DESC'];
type OrderBy<Cols> = Order<Cols>[];

interface Select<TableT, Cols = null, WhereCols = never, WhereAnyCols = never> {
  (
    ...args: [WhereCols, WhereAnyCols] extends [never, never]
      ? []
      : [
          where: SimplifyType<
            LoosePick<TableT, WhereCols> & {
              [K in WhereAnyCols & string]: Set<TableT[K & keyof TableT]>;
            }
          >,
        ]
  ): [Cols] extends [null] ? TableT[] : LoosePick<TableT, Cols>[];

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
      ? []
      : [where: LoosePick<TableT, WhereCols>]
  ): [Cols] extends [null] ? TableT : LoosePick<TableT, Cols>;

  columns<NewCols extends keyof TableT>(
    cols: NewCols[],
  ): SelectOne<TableT, NewCols, WhereCols>;

  where<WhereCols extends keyof TableT>(
    cols: WhereCols[],
  ): SelectOne<TableT, Cols, WhereCols>;

  orderBy(order: OrderBy<keyof TableT>): this;
}

const typedDb = new TypedSQL(tables);

const selectComment = typedDb.select('comment');
const comments = selectComment();
// type is Comment[]!
// @ts-expect-error Cannot pass argument without where()
selectComment({});

const selectCommentCols = selectComment.columns([
  'id',
  'author_id',
  'content_md',
]);
const narrowedComments = selectCommentCols();
// type is {
//     id: string;
//     author_id: string;
//     content_md: string;
// }[]
// This is a good example of a place where preventing distribution is key ([Cols] extends [null])
// and where SimplifyType is key (otherwise LoosePick shows up).
// See commit 177d448

const selectCommentsById = selectComment.where(['id']);
const commentsById = selectCommentsById({id: '123'});
// type is Comment[]
// @ts-expect-error Must pass ID
selectCommentsById();
// @ts-expect-error Cannot pass other columns (though only because of EPC)
selectCommentsById({id: '123', author_id: 'abc'});

const orderedSelectAll = selectComment.orderBy([['created_at', 'DESC']]);
const orderedComments = orderedSelectAll();
// type is Comment[]

selectComment.orderBy([
  ['created_at', 'DESC'],
  ['author_id', 'ASC'],
]);

// @ts-expect-error desc should be capitalized
selectComment.orderBy([['created_at', 'desc']]);

// @ts-expect-error needs to be array of tuples, not just one tuple
selectComment.orderBy(['created_at', 'desc']);

const selectAnyOf = selectComment.where([any('id')]);
const manyComments = selectAnyOf({id: new Set(['123', 'abc'])});

// @ts-expect-error needs to be a Set, not a string
selectAnyOf({id: 'abc'});

const selectById = typedDb.selectByPrimaryKey('comment');
const comment123 = selectById({id: '123'});
// type is Comment

const selectByIdCols = selectById.columns([
  'doc_id',
  'author_id',
  'content_md',
]);
const comment123c = selectByIdCols({id: '123'});
// type is {
//     doc_id: string;
//     author_id: string;
//     content_md: string;
// }

typedDb.select('comment').where(['author_id', any('doc_id')]);
const anyDocId = any('id');

// Notes on type display:
// This is gross:
// const comments: LoosePick<Comment, keyof Comment>[]
//
// I'm unable to make this show up as anything but `order: OrderBy<keyof Comment>`
// selectComment.orderBy(<autocomplete>
//
// Without SimplifyType<>, selectCommentsById shows up as:
//   const selectCommentsById: Select
//   (where: {
//     id: string;
//   } & {}) => Comment[]
