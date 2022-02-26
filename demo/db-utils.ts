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

  insert<Table extends keyof SchemaT>(
    tableName: Table,
  ): Insert<
    LooseKey3<SchemaT, Table, '$type'>,
    LooseKey3<SchemaT, Table, '$input'>
  > {
    return null as any;
  }

  insertMultiple<Table extends keyof SchemaT>(
    tableName: Table,
  ): InsertMultiple<
    LooseKey3<SchemaT, Table, '$type'>,
    LooseKey3<SchemaT, Table, '$input'>
  > {
    return null as any;
  }

  update<Table extends keyof SchemaT>(
    tableName: Table,
  ): Update<LooseKey3<SchemaT, Table, '$type'>> {
    return null as any;
  }

  updateByPrimaryKey<Table extends keyof SchemaT>(
    tableName: Table,
  ): Update<
    LooseKey3<SchemaT, Table, '$type'>,
    LooseKey3<SchemaT, Table, 'primaryKey'>,
    never,
    null,
    true
  > {
    return this.update(tableName)
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

type LoosePick<T, K> = Resolve<Pick<T, K & keyof T>>;

// eslint-disable-next-line @typescript-eslint/ban-types
type Resolve<T> = T extends Function ? T : {[K in keyof T]: T[K]};

type Order<Cols> = [column: Cols, order: 'ASC' | 'DESC'];
type OrderBy<Cols> = Order<Cols>[];

interface Select<TableT, Cols = null, WhereCols = never, WhereAnyCols = never> {
  (
    ...args: [WhereCols, WhereAnyCols] extends [never, never]
      ? []
      : [
          where: Resolve<
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
  ): Promise<LoosePick<TableT, Cols> | null>;

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
  (row: Omit<InsertT, DisallowedColumns & keyof InsertT>): Promise<TableT>;

  disallowColumns<DisallowedColumns extends OptionalKeys<InsertT>>(
    cols: DisallowedColumns[],
  ): Insert<TableT, InsertT, DisallowedColumns>;
}

interface InsertMultiple<TableT, InsertT, DisallowedColumns = never> {
  (rows: Omit<InsertT, DisallowedColumns & keyof InsertT>[]): Promise<TableT[]>;

  disallowColumns<DisallowedColumns extends OptionalKeys<InsertT>>(
    cols: DisallowedColumns[],
  ): InsertMultiple<TableT, InsertT, DisallowedColumns>;
}

interface Update<
  TableT,
  WhereCols = null,
  WhereAnyCols = never,
  SetCols = null,
  LimitOne = false,
> {
  (
    where: Resolve<
      LoosePick<TableT, WhereCols> & {
        [K in WhereAnyCols & string]: Set<TableT[K & keyof TableT]>;
      }
    >,
    update: [SetCols] extends [null]
      ? Partial<TableT>
      : LoosePick<TableT, SetCols>,
  ): Promise<LimitOne extends false ? TableT[] : TableT | null>;

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

/// Testing ////

const typedDb = new TypedSQL(tables);

const selectComment = typedDb.select('comment');
const comments = selectComment();
// type is Comment[]
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
// type is Promise<Comment | null>

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

const selectComments = typedDb
  .select('comment')
  .where(['author_id', any('doc_id')])
  .columns(['id', 'author_id', 'metadata']);
selectComments({author_id: 'abc', doc_id: new Set(['123', '345'])});
const anyDocId = any('id');

//#region Insert

(async () => {
  const insertComment = typedDb.insert('comment');

  const minimalComment = {
    author_id: '',
    content_md: '',
    doc_id: '12',
  };
  const fullComment = await insertComment(minimalComment); // type is Comment

  // Type on this one seems hard to simplify!
  // const insertComment: Insert
  //   (row: Omit<CommentInput, never>) => Promise<Comment>
  // Is the best thing to use a conditional type to improve the display?

  const insertCommentSafer = insertComment.disallowColumns([
    'id',
    'modified_at',
  ]);
  const newComment = await insertCommentSafer(minimalComment); // type is Comment

  // @ts-expect-error cannot set id in insert when it's been explicitly disallowed
  await insertCommentSafer({...minimalComment, id: '123'});

  // @ts-expect-error Only optional properties can be omitted for insert
  insertComment.disallowColumns(['content_md']);
})();

//#endregion

//#region Insert Multiple

(async () => {
  const insertComments = typedDb.insertMultiple('comment');

  const minimalComment = {
    author_id: '',
    content_md: '',
    doc_id: '12',
  };
  // @ts-expect-error need to specify multiple rows
  insertComments(minimalComment);

  const fullComments = await insertComments([minimalComment]); // type is Comment[]

  const insertCommentSafer = insertComments.disallowColumns([
    'id',
    'modified_at',
  ]);
  const newComments = await insertCommentSafer([minimalComment]); // type is Comment[]

  // @ts-expect-error cannot set id in insert when it's been explicitly disallowed
  await insertCommentSafer([{...minimalComment, id: '123'}]);

  // @ts-expect-error Only optional properties can be omitted for insert
  insertComments.disallowColumns(['content_md']);
})();

//#endregion

//#region updateWhere

const updateUser = typedDb.update('users').where(['id']);
const updatedUsers = updateUser({id: '123'}, {pronoun: 'She/her'});
// type is Promise<Users[]>

const updateUserPronoun = updateUser.set(['pronoun']);
const pronounedUsers = updateUserPronoun({id: '123'}, {pronoun: 'she/her'});
// type is Promise<Users[]>

updateUserPronoun({id: '123'}, {pronoun: null}); // ok, column is nullable

// @ts-expect-error May only update pronoun (because of EPC)
updateUserPronoun({id: '123'}, {pronoun: null, name: 'blah'});

// @ts-expect-error Must update pronoun
updateUserPronoun({id: '123'}, {});

const updateWithAny = typedDb
  .update('comment')
  .where(['author_id', any('doc_id')])
  .set(['modified_at', 'content_md']);

const newComments = updateWithAny(
  {author_id: 'dan', doc_id: new Set(['123'])},
  {modified_at: null, content_md: 'Hello!'},
);
// type is Promise<Comment[]>

//#endregion

//#region updateByPrimaryKey

const updateDocById = typedDb.updateByPrimaryKey('doc');
updateDocById({id: '123'}, {contents: 'Whodunnit?'});

//#endregion

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
//
// It's important that SimplifyType is:
//   type SimplifyType<T> = T extends Function ? T : {[K in keyof T]: T[K]};
// rather than just:
//   type SimplifyType<T> = {[K in keyof T]: T[K]};
// The latter is unable to "simplify" a Pick<>.
