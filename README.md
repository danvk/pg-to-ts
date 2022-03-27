# pg-to-ts

`pg-to-ts` generates TypeScript types that match your Postgres database schema.
It works by querying the Postgres metadata schema (`pg_catalog`) and generating
equivalent TypeScript types, as well as some JavaScript values that can be
helpful for generating queries at runtime.

Usage:

    npm install pg-to-ts
    pg-to-ts generate -c postgresql://user:pass@host/db -o dbschema.ts

The resulting file looks like:

```ts
// Table product
export interface Product {
  id: string;
  name: string;
  description: string;
  created_at: Date;
}
export interface ProductInput {
  id?: string;
  name: string;
  description: string;
  created_at?: Date;
}
const product = {
  tableName: 'product',
  columns: ['id', 'name', 'description', 'created_at'],
  requiredForInsert: ['name', 'description'],
} as const;

export interface TableTypes {
  product: {
    select: Product;
    input: ProductInput;
  };
}

export const tables = {
  product,
};
```

This gives you most of the types you need for static analysis and runtime.

This is a fork of [PYST/schemats][pyst-fork], which is a fork of [SweetIQ/schemats][orig-repo]. Compared to those projects, this fork:

- Drops support for MySQL in favor of deeper support for Postgres.
- Significantly modernizes the infrastructure and dependencies.
- Adds a few new features (see below).

## Schema Features

### Comments

If you set a Postgres comment on a table or column:

```sql
COMMENT ON TABLE product IS 'Table containing products';
COMMENT ON COLUMN product.name IS 'Human-readable product name';
```

Then these come out as JSDoc comments in the schema:

```ts
/** Table containing products */
export interface Product {
  id: string;
  /** Human-readable product name */
  name: string;
  description: string;
  created_at: Date;
}
```

The TypeScript language service will surface these when it's helpful.

### Dates as strings

node-postgres returns timestamp columns as JavaScript Date objects. This makes
a lot of sense, but it can lead to problems if you try to serialize them as
JSON, which converts them to strings. This means that the serialized and de-
serialized table types will be different.

By default `pg-to-ts` will put `Date` types in your schema file, but if you'd
prefer strings, pass `--datesAsStrings`. Note that you'll be responsible for
making sure that timestamps/dates really do come back as strings, not Date objects.
See <https://github.com/brianc/node-pg-types> for details.

### JSON types

By default, Postgres `json` and `jsonb` columns will be typed as `unknown`.
This is safe but not very precise, and it can make them cumbersome to work with.
Oftentimes you know what the type should be.

To tell `pg-to-ts` to use a specific TypeScript type for a `json` column, use
a JSDoc `@type` annotation:

```sql
ALTER TABLE product ADD COLUMN metadata jsonb;
COMMENT ON COLUMN product.metadata is 'Additional information @type {ProductMetadata}';
```

On its own, this simply acts as documentation. But if you also specify the
`--jsonTypesFile` flag, these annotations get incorporated into the schema:

    pg-to-ts generate ... --jsonTypesFile './db-types' -o dbschema.ts

Then your `dbschema.ts` will look like:

```ts
import {ProductMetadata} from './db-types';

interface Product {
  id: string;
  name: string;
  description: string;
  created_at: Date;
  metadata: ProductMetadata | null;
}
```

Presumably your `db-types.ts` file will either re-export this type from elsewhere:

```ts
export {ProductMetadata} from './path/to/this-type';
```

or define it itself:

```ts
export interface ProductMetadata {
  year?: number;
  designer?: string;
  starRating?: number;
}
```

Note that, on its own, TypeScript cannot enforce a schema on your `json`
columns. For that, you'll want a tool like [postgres-json-schema][].


### Prefix tableNames with there corresponding schemaName

--prefixWithSchemaNames

It will prefix all exports with the schema name. i.e `schemaname_tablename`. This allows you to easily namespace your exports.

If you had the following schema: 

```
Schema name: organisation
Table name: users
| id: string | name: string | team_id: string |

Table name: team
| team_id: string | name: string |
```

The following exports will be generated for you when using the `--prefixWithSchemaNames`:

```ts
interface OrganisationUsers {
  id: string;
  name: string;
  team_id: string;
}

interface OrganisationTeam {
  team_id: string;
  name: string;
}

interface OrganisationUsersInput {
  id: string;
  name: string;
  team_id: string;
}

interface OrganisationTeamInput {
  team_id: string;
  name: string;
}

const organisation_users = {
  tableName: 'users',
  columns: ['id', 'team_id'],
  requiredForInsert: ['id', 'team_id'],
  primaryKey: 'id',
  foreignKeys: { team_id: { table: 'team', column: 'team_id' }, },
} as const;

const organisation_team = {
  tableName: 'team',
  columns: ['team_id', 'name'],
  requiredForInsert: ['team_id', 'name'],
  primaryKey: 'team_id',
} as const;

export const tables = {
  organisation_users,
  organisation_team
}

export interface TableTypes {
  organisation_users: {
    select: OrganisationUsers;
    input: OrganisationUsersInput;
  };
  organisation_team: {
    select: OrganisationTeam;
    input: OrganisationTeamInput;
  };
}
```

## Command Line Usage

There are a few ways to control `pg-to-ts`:

### Command line flags

    pg-to-ts generate -c postgresql://user:pass@host/db -o dbschema.ts

### JS / JSON file

    pg-to-ts generate --config path/to/config.json
    pg-to-ts generate --config  # defaults to pg-to-ts.json
    cat pg-to-ts.json

The JSON file has configuration options as top-level keys:

```json
{
  "conn": "postgres://user@localhost:5432/postgres",
  "output": "/tmp/cli-pg-to-ts-json.ts"
}
```

### Environment variables

Flags may also be specified using environment variables prefixed with `PG_TO_TS`:

    PG_TO_TS_CONN=postgres://user@localhost:5432/postgres
    PG_TO_TS_OUTPUT=/tmp/cli-env.ts
    pg-to-ts generate

## Development Quickstart

    git clone https://github.com/danvk/schemats.git
    cd schemats
    yarn
    yarn build

    node dist/schemats.js generate -c postgresql://user:pass@host/db -o dbschema.ts

To run the unit tests:

    yarn build
    POSTGRES_URL=postgres://user@localhost:5432/postgres yarn test

To run ESLint:

    yarn lint

See [SweetIQ/schemats][orig-repo] for the original README.

[orig-repo]: https://github.com/SweetIQ/schemats
[pyst-fork]: https://github.com/PSYT/schemats
[postgres-json-schema]: https://github.com/gavinwahl/postgres-json-schema
