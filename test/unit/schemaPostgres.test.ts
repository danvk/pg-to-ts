import * as assert from 'assert';
import sinon from 'sinon';
import proxyquire from 'proxyquire';
import PgPromise from 'pg-promise';
import {ColumnDefinition} from '../../src/schemaInterfaces';
import Options from '../../src/options';
import { pgTypeToTsType, PostgresDatabase } from '../../src/schemaPostgres';

const options = new Options({});
const pgp = PgPromise();

describe('PostgresDatabase', () => {
  const sandbox = sinon.sandbox.create();
  const db = {
    query: sandbox.stub(),
    each: sandbox.stub(),
    map: sandbox.stub(),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let PostgresDBReflection: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let PostgresProxy: any;
  before(() => {
    const pgpStub = () => db;
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
  });

  describe('mapTableDefinitionToType', () => {
    it('adds TS types to a table definition', () => {
      assert.equal(
        PostgresDatabase.mapTableDefinitionToType(
          {
            columns: {
              id: {
                udtName: '_uuid',
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
        {
          id: {
            udtName: '_uuid',
            nullable: false,
            hasDefault: true,
            tsType: 'string',
          },
          boolCol: {
            udtName: '_bool',
            nullable: false,
            hasDefault: false,
            tsType: 'bool',
          },
          charCol: {
            udtName: '_varchar',
            nullable: true,
            hasDefault: false,
            tsType: 'string | null',
          },
          primaryKey: 'id',
        },
      );
    });
  });
});
