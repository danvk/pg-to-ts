import * as assert from 'assert';
import * as sinon from 'sinon';
import * as proxyquire from 'proxyquire';
import * as PgPromise from 'pg-promise';
import {ColumnDefinition, TableDefinition} from '../../src/schemaInterfaces';
import Options from '../../src/options';
// import type {PostgresDatabase} from '../../src/schemaPostgres';
import { pgTypeToTsType } from '../../src/schemaPostgres';

const options = new Options({});
const pgp = PgPromise();

describe('PostgresDatabase', () => {
  const sandbox = sinon.sandbox.create();
  const db = {
    query: sandbox.stub(),
    each: sandbox.stub(),
    map: sandbox.stub(),
  };
  let PostgresDBReflection: any;  // typeof PostgresDatabase
  let PostgresProxy: any;
  before(() => {
    const pgpStub: any = () => db;
    pgpStub.as = pgp.as;
    const SchemaPostgres = proxyquire('../../src/schemaPostgres', {
      'pg-promise': () => pgpStub,
    });
    PostgresDBReflection = SchemaPostgres.PostgresDatabase;
    PostgresProxy = new PostgresDBReflection();
  });
  beforeEach(() => {
    sandbox.reset();
  });
  after(() => {
    sandbox.restore();
  });
  describe('query', () => {
    it('calls postgres query', () => {
      PostgresProxy.query('SELECT * FROM TEST');
      assert.equal(db.query.getCall(0).args[0], 'SELECT * FROM TEST');
    });
  });
  describe('getEnumTypes', () => {
    it('writes correct query with schema name', () => {
      PostgresProxy.getEnumTypes('schemaName');
      assert.equal(
        db.each.getCall(0).args[0],
        'select n.nspname as schema, t.typname as name, e.enumlabel as value ' +
          'from pg_type t join pg_enum e on t.oid = e.enumtypid ' +
          'join pg_catalog.pg_namespace n ON n.oid = t.typnamespace ' +
          "where n.nspname = 'schemaName' " +
          'order by t.typname asc, e.enumlabel asc;',
      );
      assert.deepEqual(db.each.getCall(0).args[1], []);
    });
    it('writes correct query without schema name', () => {
      PostgresProxy.getEnumTypes();
      assert.equal(
        db.each.getCall(0).args[0],
        'select n.nspname as schema, t.typname as name, e.enumlabel as value ' +
          'from pg_type t join pg_enum e on t.oid = e.enumtypid ' +
          'join pg_catalog.pg_namespace n ON n.oid = t.typnamespace  ' +
          'order by t.typname asc, e.enumlabel asc;',
      );
      assert.deepEqual(db.each.getCall(0).args[1], []);
    });
    it('handles response from db', async () => {
      const enums = await PostgresProxy.getEnumTypes();
      const callback = db.each.getCall(0).args[2];
      const dbResponse = [
        {name: 'name', value: 'value1'},
        {name: 'name', value: 'value2'},
      ];
      dbResponse.forEach(callback);
      assert.deepEqual(enums, {name: ['value1', 'value2']});
    });
  });
  describe('getTableDefinition', () => {
    it('writes correct query', () => {
      PostgresProxy.getTableDefinition('tableName', 'schemaName');
      assert.equal(
        db.each.getCall(0).args[0],
        'SELECT column_name, udt_name, is_nullable ' +
          'FROM information_schema.columns ' +
          'WHERE table_name = $1 and table_schema = $2',
      );
      assert.deepEqual(db.each.getCall(0).args[1], ['tableName', 'schemaName']);
    });
    it('handles response from db', async () => {
      const tableDefinition = await PostgresProxy.getTableDefinition();
      const callback = db.each.getCall(0).args[2];
      const dbResponse = [
        {column_name: 'col1', udt_name: 'int2', is_nullable: 'YES'},
        {column_name: 'col2', udt_name: 'text', is_nullable: 'NO'},
      ];
      dbResponse.forEach(callback);
      assert.deepEqual(tableDefinition, {
        col1: {udtName: 'int2', nullable: true},
        col2: {udtName: 'text', nullable: false},
      });
    });
  });
  describe('getTableTypes', () => {
    const tableTypesSandbox = sinon.sandbox.create();
    before(() => {
      tableTypesSandbox.stub(PostgresProxy, 'getEnumTypes');
      tableTypesSandbox.stub(PostgresProxy, 'getTableDefinition');
      tableTypesSandbox.stub(PostgresDBReflection, 'mapTableDefinitionToType');
    });
    beforeEach(() => {
      tableTypesSandbox.reset();
    });
    after(() => {
      tableTypesSandbox.restore();
    });
    it('gets custom types from enums', async () => {
      PostgresProxy.getEnumTypes.returns(
        Promise.resolve({enum1: [], enum2: []}),
      );
      PostgresProxy.getTableDefinition.returns(Promise.resolve({}));
      await PostgresProxy.getTableTypes('tableName', 'tableSchema');
      assert.deepEqual(
        PostgresDBReflection.mapTableDefinitionToType.getCall(0).args[1],
        ['enum1', 'enum2'],
      );
    });
    it('gets table definitions', async () => {
      PostgresProxy.getEnumTypes.returns(Promise.resolve({}));
      PostgresProxy.getTableDefinition.returns(
        Promise.resolve({
          table: {
            udtName: 'name',
            nullable: false,
          },
        }),
      );
      await PostgresProxy.getTableTypes('tableName', 'tableSchema');
      assert.deepEqual(PostgresProxy.getTableDefinition.getCall(0).args, [
        'tableName',
        'tableSchema',
      ]);
      assert.deepEqual(
        PostgresDBReflection.mapTableDefinitionToType.getCall(0).args[0],
        {
          table: {
            udtName: 'name',
            nullable: false,
          },
        },
      );
    });
  });
  describe('getSchemaTables', () => {
    it('writes correct query', () => {
      PostgresProxy.getSchemaTables('schemaName');
      assert.equal(
        db.map.getCall(0).args[0],
        'SELECT table_name ' +
          'FROM information_schema.columns ' +
          'WHERE table_schema = $1 ' +
          'GROUP BY table_name',
      );
      assert.deepEqual(db.map.getCall(0).args[1], ['schemaName']);
    });
    it('handles response from db', async () => {
      await PostgresProxy.getSchemaTables();
      const callback = db.map.getCall(0).args[2];
      const dbResponse = [{table_name: 'table1'}, {table_name: 'table2'}];
      const schemaTables = dbResponse.map(callback);
      assert.deepEqual(schemaTables, ['table1', 'table2']);
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
        assert.equal(
          pgTypeToTsType(td, [], options),
          'string',
        );
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
        assert.equal(
          pgTypeToTsType(td, [], options),
          'number',
        );
      }
    });

    it('maps to boolean', () => {
      const td: ColumnDefinition = {
          udtName: 'bool',
          nullable: false,
          hasDefault: false,
      };
      assert.equal(
        pgTypeToTsType(td, [], options),
        'boolean',
      );
    });

    it('maps to Object', () => {
      for (const udtName of [
        'json',
        'jsonb',
      ]) {
        const td: ColumnDefinition = {
          udtName,
          nullable: false,
          hasDefault: false,
        };
        assert.equal(
          pgTypeToTsType(td, [], options),
          'Object',
        );
      }
    });

    it('maps to Date', () => {
      for (const udtName of [
        'date',
        'timestamp',
        'timestamptz',
      ]) {
        const td: ColumnDefinition = {
          udtName,
          nullable: false,
          hasDefault: false,
        };
        assert.equal(
          pgTypeToTsType(td, [], options),
          'Date',
        );
      }
    });

    it('maps to Array<number>', () => {
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
        assert.equal(
          pgTypeToTsType(td, [], options),
          'Array<number>',
        );
      }
    });


    describe('maps to Array<boolean>', () => {
      it('_bool', () => {
        const td: TableDefinition = {
          column: {
            udtName: '_bool',
            nullable: false,
          },
        };
        assert.equal(
          PostgresDBReflection.mapTableDefinitionToType(
            td,
            ['CustomType'],
            options,
          ).column.tsType,
          'Array<boolean>',
        );
      });
    });

    describe('maps to Array<string>', () => {
      it('_varchar', () => {
        const td: TableDefinition = {
          column: {
            udtName: '_varchar',
            nullable: false,
          },
        };
        assert.equal(
          PostgresDBReflection.mapTableDefinitionToType(
            td,
            ['CustomType'],
            options,
          ).column.tsType,
          'Array<string>',
        );
      });
      it('_text', () => {
        const td: TableDefinition = {
          column: {
            udtName: '_text',
            nullable: false,
          },
        };
        assert.equal(
          PostgresDBReflection.mapTableDefinitionToType(
            td,
            ['CustomType'],
            options,
          ).column.tsType,
          'Array<string>',
        );
      });
      it('_citext', () => {
        const td: TableDefinition = {
          column: {
            udtName: '_citext',
            nullable: false,
          },
        };
        assert.equal(
          PostgresDBReflection.mapTableDefinitionToType(
            td,
            ['CustomType'],
            options,
          ).column.tsType,
          'Array<string>',
        );
      });
      it('_uuid', () => {
        const td: TableDefinition = {
          column: {
            udtName: '_uuid',
            nullable: false,
          },
        };
        assert.equal(
          PostgresDBReflection.mapTableDefinitionToType(
            td,
            ['CustomType'],
            options,
          ).column.tsType,
          'Array<string>',
        );
      });
      it('_bytea', () => {
        const td: TableDefinition = {
          column: {
            udtName: '_bytea',
            nullable: false,
          },
        };
        assert.equal(
          PostgresDBReflection.mapTableDefinitionToType(
            td,
            ['CustomType'],
            options,
          ).column.tsType,
          'Array<string>',
        );
      });
    });

    describe('maps to Array<Object>', () => {
      it('_json', () => {
        const td: TableDefinition = {
          column: {
            udtName: '_json',
            nullable: false,
          },
        };
        assert.equal(
          PostgresDBReflection.mapTableDefinitionToType(td, [], options).column
            .tsType,
          'Array<Object>',
        );
      });
      it('_jsonb', () => {
        const td: TableDefinition = {
          column: {
            udtName: '_jsonb',
            nullable: false,
          },
        };
        assert.equal(
          PostgresDBReflection.mapTableDefinitionToType(td, [], options).column
            .tsType,
          'Array<Object>',
        );
      });
    });

    describe('maps to Array<Date>', () => {
      it('_timestamptz', () => {
        const td: TableDefinition = {
          column: {
            udtName: '_timestamptz',
            nullable: false,
          },
        };
        assert.equal(
          PostgresDBReflection.mapTableDefinitionToType(td, [], options).column
            .tsType,
          'Array<Date>',
        );
      });
    });

    describe('maps to custom', () => {
      it('CustomType', () => {
        const td: TableDefinition = {
          column: {
            udtName: 'CustomType',
            nullable: false,
          },
        };
        assert.equal(
          PostgresDBReflection.mapTableDefinitionToType(
            td,
            ['CustomType'],
            options,
          ).column.tsType,
          'CustomType',
        );
      });
    });

    describe('maps to any', () => {
      it('UnknownType', () => {
        const td: TableDefinition = {
          column: {
            udtName: 'UnknownType',
            nullable: false,
          },
        };
        assert.equal(
          PostgresDBReflection.mapTableDefinitionToType(
            td,
            ['CustomType'],
            options,
          ).column.tsType,
          'any',
        );
      });
    });
  });
});
