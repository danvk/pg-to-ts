/// Testing ////

import {any, Queryable, TypedSQL} from './db-utils';
import {tables} from './dbschema';

declare let db: Queryable;
const typedDb = new TypedSQL(tables);

const commentsTable = typedDb.table('comment');
const selectComment = commentsTable.select();
const comments = selectComment(db);
// type is Comment[]
// @ts-expect-error Cannot pass argument without where()
selectComment({});

const selectCommentCols = selectComment.columns([
  'id',
  'author_id',
  'content_md',
]);
const narrowedComments = selectCommentCols(db);
// type is {
//     id: string;
//     author_id: string;
//     content_md: string;
// }[]
// This is a good example of a place where preventing distribution is key ([Cols] extends [null])
// and where SimplifyType is key (otherwise LoosePick shows up).
// See commit 177d448

const selectCommentsById = selectComment.where(['id']).fn();
const commentsById = selectCommentsById(db, {id: '123'});
// type is Comment[]
// @ts-expect-error Must pass ID
selectCommentsById();
// @ts-expect-error Cannot pass other columns (though only because of EPC)
selectCommentsById({id: '123', author_id: 'abc'});

const orderedSelectAll = selectComment.orderBy([['created_at', 'DESC']]);
const orderedComments = orderedSelectAll(db);
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
const manyComments = selectAnyOf(db, {id: new Set(['123', 'abc'])});

// @ts-expect-error needs to be a Set, not a string
selectAnyOf({id: 'abc'});

const selectById = commentsTable.selectByPrimaryKey();
const comment123 = selectById(db, {id: '123'});
// type is Promise<Comment | null>

const selectByIdCols = selectById.columns([
  'doc_id',
  'author_id',
  'content_md',
]);
const comment123c = selectByIdCols(db, {id: '123'});
// type is {
//     doc_id: string;
//     author_id: string;
//     content_md: string;
// }

const selectComments = commentsTable
  .select()
  .where(['author_id', any('doc_id')])
  .columns(['id', 'author_id', 'metadata']);
selectComments(db, {author_id: 'abc', doc_id: new Set(['123', '345'])});
const anyDocId = any('id');

//#region Insert

(async () => {
  const insertComment = commentsTable.insert();

  const minimalComment = {
    author_id: '',
    content_md: '',
    doc_id: '12',
  };
  const fullComment = await insertComment(db, minimalComment); // type is Comment

  // Type on this one seems hard to simplify!
  // const insertComment: Insert
  //   (row: Omit<CommentInput, never>) => Promise<Comment>
  // Is the best thing to use a conditional type to improve the display?

  const insertCommentSafer = insertComment
    .disallowColumns(['id', 'modified_at'])
    .fn();
  const newComment = await insertCommentSafer(db, minimalComment); // type is Comment

  // @ts-expect-error cannot set id in insert when it's been explicitly disallowed
  await insertCommentSafer({...minimalComment, id: '123'});

  // @ts-expect-error Only optional properties can be omitted for insert
  insertComment.disallowColumns(['content_md']);
})();

//#endregion

//#region Insert Multiple

(async () => {
  const insertComments = commentsTable.insertMultiple();

  const minimalComment = {
    author_id: '',
    content_md: '',
    doc_id: '12',
  };
  // @ts-expect-error need to specify multiple rows
  insertComments(minimalComment);

  const fullComments = await insertComments(db, [minimalComment]); // type is Comment[]

  const insertCommentSafer = insertComments
    .disallowColumns(['id', 'modified_at'])
    .fn();
  const newComments = await insertCommentSafer(db, [minimalComment]); // type is Comment[]

  // @ts-expect-error cannot set id in insert when it's been explicitly disallowed
  await insertCommentSafer([{...minimalComment, id: '123'}]);

  // @ts-expect-error Only optional properties can be omitted for insert
  insertComments.disallowColumns(['content_md']);
})();

//#endregion

//#region updateWhere

const usersTable = typedDb.table('users');
const updateUser = usersTable.update().where(['id']);
const updatedUsers = updateUser(db, {id: '123'}, {pronoun: 'She/her'});
// type is Promise<Users[]>

const updateUserPronoun = updateUser.set(['pronoun']);
const pronounedUsers = updateUserPronoun(db, {id: '123'}, {pronoun: 'she/her'});
// type is Promise<Users[]>

updateUserPronoun(db, {id: '123'}, {pronoun: null}); // ok, column is nullable

// @ts-expect-error May only update pronoun (because of EPC)
updateUserPronoun({id: '123'}, {pronoun: null, name: 'blah'});

// @ts-expect-error Must update pronoun
updateUserPronoun({id: '123'}, {});

const updateWithAny = commentsTable
  .update()
  .where(['author_id', any('doc_id')])
  .set(['modified_at', 'content_md']);

const newComments = updateWithAny(
  db,
  {author_id: 'dan', doc_id: new Set(['123'])},
  {modified_at: null, content_md: 'Hello!'},
);
// type is Promise<Comment[]>

//#endregion

//#region updateByPrimaryKey

const docsTable = typedDb.table('doc');
const updateDocById = docsTable.updateByPrimaryKey().fn();
updateDocById(db, {id: '123'}, {contents: 'Whodunnit?'});

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

// Debugging display from cityci

const getProjectsByOrgRaw = typedDb
  .table('project')
  .select()
  .where(['org_slug', 'archived'])
  .fn();
const getCommentsByBlah = typedDb.table('comment').select().where(['id']);
const getCommentsByBlah2 = selectComment.where(['id']);
