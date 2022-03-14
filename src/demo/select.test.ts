/// Testing ////

import {any, Queryable, TypedSQL} from './db-utils';
import {tables} from './dbschema';

declare let db: Queryable;
const typedDb = new TypedSQL(tables);

const commentsTable = typedDb.table('comment');
const selectComment = commentsTable.select();

describe('types for select queries ', () => {
  it('should select all', async () => {
    const selectAll = selectComment.fn();
    //    ^? const selectAll: (db: Queryable) => Promise<Comment[]>
    const comments = await selectAll(db);
    comments;
    // ^? Comment[]
    // @ts-expect-error Cannot pass argument without where()
    selectComment({});
  });

  it('should select all with specific columns', () => {
    const selectCommentCols = selectComment
      .columns(['id', 'author_id', 'content_md'])
      .fn();
    selectCommentCols;
    // ^? const selectCommentCols: (db: Queryable) => Promise<{
    //     id: string;
    //     author_id: string;
    //     content_md: string;
    // }[]>

    const comments = selectCommentCols(db);
    comments;
    // ^? {
    //      id: string;
    //      author_id: string;
    //      content_md: string;
    //    }[]

    // @ts-expect-error this column was not selected
    comments[0].doc_id;

    // @ts-expect-error Cannot pass argument without where()
    selectCommentCols({});

    // This is a good example of a place where preventing distribution is key ([Cols] extends [null])
    // and where SimplifyType is key (otherwise LoosePick shows up).
    // See commit 177d448
  });

  it('should accept an orderBy without changing the call signature', async () => {
    const orderedSelectAll = selectComment
      .orderBy([['created_at', 'DESC']])
      .fn();
    orderedSelectAll;
    // ^? const orderedSelectAll: (db: Queryable) => Promise<Comment[]>

    const orderedComments = orderedSelectAll(db);
    orderedComments;
    // ^? const orderedComments: Promise<Comment[]>

    // OK to invoke with multiple order bys
    selectComment.orderBy([
      ['created_at', 'DESC'],
      ['author_id', 'ASC'],
    ]);

    // @ts-expect-error desc should be capitalized
    selectComment.orderBy([['created_at', 'desc']]);

    // @ts-expect-error needs to be array of tuples, not just one tuple
    selectComment.orderBy(['created_at', 'DESC']);

    // @ts-expect-error rejects invalid column names
    selectComment.orderBy([['display_name', 'DESC']]);
  });

  it('should select by a single column', async () => {
    const selectCommentsById = selectComment.where(['id']).fn();
    //    ^? const selectCommentsById: (db: Queryable, where: {
    //         id: string;
    //       }) => Promise<Comment[]>

    const commentsById = selectCommentsById(db, {id: '123'});
    commentsById;
    // ^? const commentsById: Promise<Comment[]>

    // @ts-expect-error Must pass ID
    selectCommentsById();

    // @ts-expect-error Cannot pass other columns (though only because of EPC)
    selectCommentsById({id: '123', author_id: 'abc'});
  });

  it('should allow selecting by a set of possible values', async () => {
    const selectAnyOf = selectComment.where([any('id')]).fn();
    //    ^? const selectAnyOf: (db: Queryable, where: {
    //         id: readonly string[] | Set<string>;
    //       }) => Promise<Comment[]>

    let manyComments = selectAnyOf(db, {id: new Set(['123', 'abc'])});
    manyComments;
    // ^? const manyComments: Promise<Comment[]>

    // arrays are also OK
    manyComments = selectAnyOf(db, {id: ['123', 'abc']});

    // readonly arrays are OK
    const ids = ['123', 'abc'] as const;
    selectAnyOf(db, {id: ids});

    // @ts-expect-error needs to be a Set or array, not a string
    selectAnyOf(db, {id: 'abc'});
  });

  it('should select by primary key', async () => {
    const selectById = commentsTable.selectByPrimaryKey().fn();
    //    ^? const selectById: (db: Queryable, where: {
    //         id: string;
    //       }) => Promise<Comment | null>

    const comment123 = selectById(db, {id: '123'});
    comment123;
    // ^? const comment123: Promise<Comment | null>
  });

  it('should select by primary key with limited columns', async () => {
    const selectById = commentsTable.selectByPrimaryKey();
    const selectByIdCols = selectById
      .columns(['doc_id', 'author_id', 'content_md'])
      .fn();
    selectByIdCols;
    // ^? const selectByIdCols: (db: Queryable, where: {
    //      id: string;
    //    }) => Promise<{
    //        doc_id: string;
    //        author_id: string;
    //        content_md: string;
    //    } | null>

    const comment123 = await selectByIdCols(db, {id: '123'});
    comment123;
    // ^? const comment123: {
    //      doc_id: string;
    //      author_id: string;
    //      content_md: string;
    //    } | null
  });

  it('should combine singular and plural where clauses', async () => {
    const complexSelect = selectComment
      .where(['author_id', any('doc_id')])
      .columns(['id', 'author_id', 'metadata'])
      .fn();
    complexSelect;
    // ^? const complexSelect: (db: Queryable, where: {
    //        author_id: string;
    //        doc_id: readonly string[] | Set<string>;
    //    }) => Promise<{
    //        id: string;
    //        author_id: string;
    //        metadata: CommentMetadata | null;
    //    }[]>

    const comments = await complexSelect(db, {
      author_id: 'abc',
      doc_id: new Set(['123', '345']),
    });
    comments;
    // ^? const comments: {
    //        id: string;
    //        author_id: string;
    //        metadata: CommentMetadata | null;
    //    }[]

    // @ts-expect-error cannot use any() with invalid column
    selectComment.where([any('display'), any('doc_id')]);
  });

  it('should allow multiple plural where clauses', async () => {
    const select = selectComment.where([any('author_id'), any('doc_id')]).fn();
    select;
    // ^? const select: (db: Queryable, where: {
    //        doc_id: readonly string[] | Set<string>;
    //        author_id: readonly string[] | Set<string>;
    //    }) => Promise<Comment[]>
  });
});
