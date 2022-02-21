import {tables} from './dbschema';

class TypedSQL<SchemaT> {
  schema: SchemaT;
  constructor(schema: SchemaT) {
    this.schema = schema;
  }

  select<Table extends keyof SchemaT>(
    tableName: Table,
  ): Select<LooseKey3<SchemaT, '$schema', Table>> {
    const fn = () => {
      return [tableName] as any;
    };
    fn.columns = (cols: any[]) => fn;
    return fn;
  }
}

type LooseKey<T, K> = T[K & keyof T];
type LooseKey3<T, K1, K2> = LooseKey<LooseKey<T, K1>, K2>;
type LooseKey4<T, K1, K2, K3> = LooseKey<LooseKey3<T, K1, K2>, K3>;

type LoosePick<T, K> = SimplifyType<Pick<T, K & keyof T>>;

// eslint-disable-next-line @typescript-eslint/ban-types
type SimplifyType<T> = T extends Function ? T : {[K in keyof T]: T[K]};

interface Select<TableT, Cols = null> {
  (): [Cols] extends [null]
    ? LooseKey<TableT, 'select'>[]
    : LoosePick<LooseKey<TableT, 'select'>, Cols>[];

  columns<NewCols extends keyof LooseKey<TableT, 'select'>>(
    cols: NewCols[],
  ): Select<TableT, NewCols>;
}

const typedDb = new TypedSQL(tables);

const selectComment = typedDb.select('comment');
const comments = selectComment();
// type is Comment[]!

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

// Notes on type display:
// This is gross:
// const comments: LoosePick<Comment, keyof Comment>[]
