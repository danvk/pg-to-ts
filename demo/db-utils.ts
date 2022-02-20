import {tables} from './dbschema';

class TypedSQL<SchemaT> {
  schema: SchemaT;
  constructor(schema: SchemaT) {
    this.schema = schema;
  }

  select<Table extends keyof SchemaT>(
    tableName: Table,
  ): Select<SchemaT, Table> {
    const fn = () => {
      return [tableName] as any;
    };
    return fn;
  }
}

type LooseKey<T, K> = T[K & keyof T];
type LooseKey2<T, K1, K2> = LooseKey<LooseKey<T, K1>, K2>;
type LooseKey3<T, K1, K2, K3> = LooseKey<LooseKey2<T, K1, K2>, K3>;

interface Select<SchemaT, Table extends Omit<keyof SchemaT, '$schema'>> {
  (): LooseKey3<SchemaT, '$schema', Table, 'select'>[];
}

const typedDb = new TypedSQL(tables);

const selectComment = typedDb.select('comment');
const comments = selectComment();
// type is Comment[]!
