# Changelog

## 4.1.0 (2022/04/02)

- New option: `--prefixWithSchemaNames`. This adds the schema as a prefix to
  all output symbols and types. Useful for when you have many schemas in your
  database and need to keep all the tables straight.
  See <https://github.com/danvk/pg-to-ts/pull/14>, thanks @jamesone!
- New feature: type links in runtime values. The runtime constants generated
  for each table now contain `$type` and `$input` properties, and foreign keys
  have a `$type` property to connect to the linked type. This means that
  `typeof tableName['$type']` can be used to get the (TypeScript) table type.
  This should be especially helpful for libraries using pg-to-ts.

## 4.0.0 (2022/02/19)

- Dependency updates; pg-to-ts should now work with Node 14+.
- Officially dropped support for Node 6.
- Remove `export namespace every` variants of `enum` types (it's unclear to me how these were ever intended to work).
- Added types for enum arrays (previously they were typed to `any`, now they're typed to `EnumType[]`).
- Changed the prefix for environment variables from `SCHEMATS` → `PG_TO_TS` and documented how to use them.
- Changed the default config file name from `schemats.json` to `pg-to-ts.json`.
- Significantly modernize tooling; unit tests now run via GitHub actions and post code coverage.

## 3.7.1 (2021/10/19)

- Make TypeScript a peer dependency, rather than a direct dependency.

## 3.6.0 (2021/03/18)

- Added `--jsonTypesFile` option.
- Rewrote `README.md` and renamed the repo to `pg-to-ts` to match the name on npm.
