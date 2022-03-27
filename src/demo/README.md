# DB Utils

## Todo

- [ ] Set up type testing, ideally via string matching
- [ ] Implement runtime
  - [x] select
  - [x] insert
  - [x] update
  - [ ] delete
  - [ ] Insert multiple
  - [ ] Add tests that roll back mutations
  - [ ] Switch tests from pg-promise to node-postgres
- [ ] Type Tests
  - [x] select types
  - [ ] insert types
  - [ ] update types
  - [ ] delete types
- [ ] Make `select()` take optional list of columns and drop `where`
- [ ] Add upsert?
- [ ] Make `where` take varargs instead of an array
- [ ] Change `.fn()` --> `.build()` and make it mandatory
- [ ] Pick a name
  - [ ] everyday-crud (available)
  - [ ] crudette (available)
  - something around the theme of "everyday essentials"
  - x crudite -- taken by a similar library
- [ ] Support both node-postgres _and_ pg-promise
      https://stackoverflow.com/a/32272298/388951
- [x] Joined select
- [x] Should `$type` and `$input` be symbols? (probably not)
- [x] Implement runtime tests
- [x] Rework API to look like `typedDb.table().select()`?
- [x] Make them take DB params
- [x] Update pg-to-ts to generate `$type` and `$input`
- [x] Update with `ANY()`
- [x] Update (updateWhere / updateByKey)
- [x] Insert
- [x] Insert multiple
- [x] Support sets in `select`
- [x] `selectByPrimaryKey`

Would it be better to have the API look more like:

```ts
typedDb.table('users').select({
  where: ['id'],
  orderBy: [['name', 'asc']],
});
```

this would eliminate the need for a `.build()` method and would
reinforce the idea that this is a limited library. `.join()` might
be awkward, though:

```ts
typedDb.table('comment').select({
  where: ['id'],
  join: ['author_id', 'doc_id'],
});
```

or maybe:

```ts
typedDb.table('comment').select({
  where: ['id'],
  join: {'author': 'author_id', 'doc': 'doc_id'},
});
```

## Other related tools

- Sqlpture
- zapatos
- PgTyped
- pg-promise
- kysely (query builder) <https://github.com/koskimas/kysely>
- knex (query builder) <https://knexjs.org/>

Rants about ORMs / query builders:
- <https://hackernoon.com/migrating-from-query-builders-and-orms-in-javascript-or-typescript-gc113uh0>
- https://www.reddit.com/r/typescript/comments/jcw28f/typeorm_sucks_something_i_wanted_to_talk_about/
- https://www.prisma.io/dataguide/database-tools/evaluating-type-safety-in-the-top-8-typescript-orms
- <https://www.jakso.me/blog/objection-to-orm-hatred> (Pro ORM)
- <https://github.com/mmkal/slonik-tools/tree/master/packages/typegen#sloniktypegen>
- <https://gajus.medium.com/stop-using-knex-js-and-earn-30-bf410349856c>
