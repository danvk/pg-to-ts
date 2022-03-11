# DB Utils

## Todo

- [ ] Delete
- [ ] Set up type testing, ideally via string matching
- [ ] Implement runtime
- [ ] Joined select
- [ ] Rework API to look like `typedDb.table().select()`?
- [ ] Should `$type` and `$input` be symbols?
- [x] Make them take DB params
- [x] Update pg-to-ts to generate `$type` and `$input`
- [x] Update with `ANY()`
- [x] Update (updateWhere / updateByKey)
- [x] Insert
- [x] Insert multiple
- [x] Support sets in `select`
- [x] `selectByPrimaryKey`

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
