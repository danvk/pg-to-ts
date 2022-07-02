import PgPromise from 'pg-promise';
import {ColumnDefinition} from '../../src/schemaInterfaces';
import Options from '../../src/options';
import {PostgresDatabase, pgTypeToTsType} from '../../src/schemaPostgres';

jest.mock('pg-promise', () => {
  const mClient = {
    connect: jest.fn(),
    query: jest.fn(),
    each: jest.fn(),
    map: jest.fn(),
    end: jest.fn(),
  };
  return jest.fn(() => {
    const mock = () => mClient;
    mock.as = jest.requireActual('pg-promise').as; // this is used for formatting
    return mock;
  });
});

const options = new Options({});

describe('PostgresDatabase', () => {
  let pg: PostgresDatabase;
  let mockedDb: jest.Mocked<PgPromise.IDatabase<unknown>>;

  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
    pg = new PostgresDatabase('conn');
    mockedDb = pg.db as jest.Mocked<PgPromise.IDatabase<unknown>>;
  });

  describe('query', () => {
    it('calls postgres query', () => {
      mockedDb.query.mockResolvedValueOnce({rows: [], rowCount: 0});
      pg.query('SELECT * FROM TEST');
      expect(pg.db.query).toBeCalledWith('SELECT * FROM TEST');
    });
  });

  describe('getEnumTypes', () => {
    it('writes correct query with schema name', async () => {
      mockedDb.each.mockResolvedValueOnce([]);
      await pg.getEnumTypes('schemaName');
      expect(pg.db.each).toHaveBeenCalledWith(
        'select n.nspname as schema, t.typname as name, e.enumlabel as value ' +
          'from pg_type t join pg_enum e on t.oid = e.enumtypid ' +
          'join pg_catalog.pg_namespace n ON n.oid = t.typnamespace ' +
          "where n.nspname = 'schemaName' " +
          'order by t.typname asc, e.enumlabel asc;',
        [],
        expect.any(Function),
      );
    });

    it('writes correct query without schema name', async () => {
      mockedDb.each.mockResolvedValueOnce([]);
      await pg.getEnumTypes();
      expect(pg.db.each).toHaveBeenCalledWith(
        'select n.nspname as schema, t.typname as name, e.enumlabel as value ' +
          'from pg_type t join pg_enum e on t.oid = e.enumtypid ' +
          'join pg_catalog.pg_namespace n ON n.oid = t.typnamespace  ' +
          'order by t.typname asc, e.enumlabel asc;',
        [],
        expect.any(Function),
      );
    });

    it('handles response from db', async () => {
      const dbResponse = [
        {name: 'name', value: 'value1'},
        {name: 'name', value: 'value2'},
      ];
      mockedDb.each = jest.fn().mockImplementation((query, args, callback) => {
        dbResponse.forEach(callback);
      });
      const enums = await pg.getEnumTypes();
      expect(enums).toEqual({name: ['value1', 'value2']});
    });
  });

  describe('getSchemaTables', () => {
    it('writes correct query', async () => {
      mockedDb.map.mockResolvedValueOnce([]);
      await pg.getSchemaTables('schemaName');
      expect(pg.db.map).toHaveBeenCalledWith(
        `
        SELECT relname as table_name
        FROM pg_class c
        JOIN pg_namespace pn ON c.relnamespace = pn.oid
        WHERE relkind IN ('r', 'v', 'm', 'p', 'f') AND pn.nspname = $1
        GROUP BY relname ORDER BY lower(relname)
      `,
        ['schemaName'],
        expect.any(Function),
      );
    });

    it('handles response from db', async () => {
      const dbResponse = [{table_name: 'table1'}, {table_name: 'table2'}];
      let schemaTables: string[] = [];
      mockedDb.map = jest.fn().mockImplementation((query, args, callback) => {
        schemaTables = dbResponse.map(callback);
      });
      await pg.getSchemaTables('schema');

      expect(schemaTables).toEqual(['table1', 'table2']);
    });
  });

  describe('pgTypeToTsType', () => {
    it('maps to string', () => {
      for (const udtName of [
        'bpchar',
        'char',
        'varchar',
        'text',
        'citext',
        'uuid',
        'bytea',
        'inet',
        'time',
        'timetz',
        'interval',
        'name',
      ]) {
        const td: ColumnDefinition = {
          udtName,
          nullable: false,
          hasDefault: false,
        };
        expect(pgTypeToTsType(td, [], options)).toEqual('string');
      }
    });

    it('maps to number', () => {
      for (const udtName of [
        'int2',
        'int4',
        'int8',
        'float4',
        'float8',
        'numeric',
        'money',
        'oid',
      ]) {
        const td: ColumnDefinition = {
          udtName,
          nullable: false,
          hasDefault: false,
        };
        expect(pgTypeToTsType(td, [], options)).toEqual('number');
      }
    });

    it('maps to boolean', () => {
      const td: ColumnDefinition = {
        udtName: 'bool',
        nullable: false,
        hasDefault: false,
      };
      expect(pgTypeToTsType(td, [], options)).toEqual('boolean');
    });

    it('maps to Object', () => {
      for (const udtName of ['json', 'jsonb']) {
        const td: ColumnDefinition = {
          udtName,
          nullable: false,
          hasDefault: false,
        };
        expect(pgTypeToTsType(td, [], options)).toEqual('Json');
      }
    });

    it('maps to Date', () => {
      for (const udtName of ['date', 'timestamp', 'timestamptz']) {
        const td: ColumnDefinition = {
          udtName,
          nullable: false,
          hasDefault: false,
        };
        expect(pgTypeToTsType(td, [], options)).toEqual('Date');
      }
    });

    it('maps to number[]', () => {
      for (const udtName of [
        '_int2',
        '_int4',
        '_int8',
        '_float4',
        '_float8',
        '_numeric',
        '_money',
      ]) {
        const td: ColumnDefinition = {
          udtName,
          nullable: false,
          hasDefault: false,
        };
        expect(pgTypeToTsType(td, [], options)).toEqual('number[]');
      }
    });
  });

  describe('mapTableDefinitionToType', () => {
    it('adds TS types to a table definition', () => {
      expect(
        PostgresDatabase.mapTableDefinitionToType(
          {
            columns: {
              id: {
                udtName: 'uuid',
                nullable: false,
                hasDefault: true,
              },
              boolCol: {
                udtName: '_bool',
                nullable: false,
                hasDefault: false,
              },
              charCol: {
                udtName: '_varchar',
                nullable: true,
                hasDefault: false,
              },
            },
            primaryKey: 'id',
            comment: 'Table Comment',
          },
          ['CustomType'],
          options,
        ).columns,
      ).toEqual({
        id: {
          udtName: 'uuid',
          nullable: false,
          hasDefault: true,
          tsType: 'string',
        },
        boolCol: {
          udtName: '_bool',
          nullable: false,
          hasDefault: false,
          tsType: 'boolean[]',
        },
        charCol: {
          udtName: '_varchar',
          nullable: true,
          hasDefault: false,
          tsType: 'string[]', // The `| null` is added elsewhere
        },
      });
    });
  });
});
