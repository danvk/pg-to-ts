import * as assert from 'assert';
import * as Typescript from '../../src/typescript';
import Options from '../../src/options';

const options = new Options({});

describe('TypeScript', () => {
  describe('generateTableInterface', () => {
    it('empty table definition object', () => {
      const [tableInterface, types] = Typescript.generateTableInterface(
        'tableName',
        {
          columns: {},
          primaryKey: null,
        },
        options,
      );
      assert.equal(
        tableInterface,
        `
      // Table tableName
       export interface TableName {
        }
       export interface TableNameInput {
        }
      const tableName = {
        tableName: 'tableName',
        columns: [],
        requiredForInsert: [],
        primaryKey: null,
        foreignKeys: {},
      } as const;
  `
      );
      assert.deepEqual(types, new Set());
    });

    it('table name is reserved', () => {
      const [tableInterface, types] = Typescript.generateTableInterface(
        'package',
        {
          columns: {},
          primaryKey: null,
        },
        options,
      );
      assert.equal(
        tableInterface,
        `
      // Table package
       export interface Package {
        }
       export interface PackageInput {
        }
      const package_ = {
        tableName: 'package',
        columns: [],
        requiredForInsert: [],
        primaryKey: null,
        foreignKeys: {},
      } as const;
  `
      );
      assert.deepEqual(types, new Set());
    });

    it('table with columns', () => {
      const [tableInterface, types] = Typescript.generateTableInterface(
        'tableName',
        {
          columns: {
            col1: {udtName: 'char', tsType: 'string', nullable: false, hasDefault: false},
            col2: {udtName: 'bool', tsType: 'boolean', nullable: false, hasDefault: false},
          },
          primaryKey: null,
        },
        options,
      );
      // TODO(danvk): fix spacing in output
      assert.equal(
        tableInterface,
        `
      // Table tableName
       export interface TableName {
        col1: string;
col2: boolean;
}
       export interface TableNameInput {
        col1: string;
col2: boolean;
}
      const tableName = {
        tableName: 'tableName',
        columns: ['col1', 'col2'],
        requiredForInsert: ['col1', 'col2'],
        primaryKey: null,
        foreignKeys: {},
      } as const;
  `
      );
      assert.deepEqual(types, new Set());
    });

    it('table with reserved columns', () => {
      const tableInterface = Typescript.generateTableInterface(
        'tableName',
        {
        columns: {
          string: {udtName: 'name1', nullable: false, hasDefault: false},
          number: {udtName: 'name2', nullable: false, hasDefault: false},
          package: {udtName: 'name3', nullable: false, hasDefault: false},
        },
        primaryKey: null,
      },
        options,
      );
      assert.equal(
        tableInterface,
        '\n' +
          '        export interface tableName {\n' +
          '        string: tableNameFields.string_;\n' +
          'number: tableNameFields.number_;\n' +
          'package: tableNameFields.package_;\n' +
          '\n' +
          '        }\n' +
          '    ',
      );
    });
  });

  describe('generateEnumType', () => {
    it('empty object', () => {
      const enumType = Typescript.generateEnumType({}, options);
      assert.equal(enumType, '');
    });
    it('with enumerations', () => {
      const enumType = Typescript.generateEnumType(
        {
          enum1: ['val1', 'val2', 'val3', 'val4'],
          enum2: ['val5', 'val6', 'val7', 'val8'],
        },
        options,
      );
      assert.equal(
        enumType,
        "export type enum1 = 'val1' | 'val2' | 'val3' | 'val4';\n" +
          "export type enum2 = 'val5' | 'val6' | 'val7' | 'val8';\n",
      );
    });
  });
});
