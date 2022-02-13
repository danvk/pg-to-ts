import * as assert from 'assert';
import * as Typescript from '../../src/typescript';
import Options from '../../src/options';

const options = new Options({});

describe('TypeScript', () => {
  describe('generateTableInterface', () => {
    it('empty table definition object', () => {
      const tableInterface = Typescript.generateTableInterface(
        'tableName',
        {
          columns: {},
          primaryKey: null,
        },
        options,
      );
      assert.equal(
        tableInterface,
        '\n' +
          '        export interface tableName {\n' +
          '        \n' +
          '        }\n' +
          '    ',
      );
    });
    it('table name is reserved', () => {
      const tableInterface = Typescript.generateTableInterface(
        'package',
        {
          columns: {},
          primaryKey: null,
        },
        options,
      );
      assert.equal(
        tableInterface,
        '\n' +
          '        export interface package_ {\n' +
          '        \n' +
          '        }\n' +
          '    ',
      );
    });
    it('table with columns', () => {
      const tableInterface = Typescript.generateTableInterface(
        'tableName',
        {
          columns: {
            col1: {udtName: 'name1', nullable: false, hasDefault: false},
            col2: {udtName: 'name2', nullable: false, hasDefault: false},
          },
          primaryKey: null,
        },
        options,
      );
      assert.equal(
        tableInterface,
        '\n' +
          '        export interface tableName {\n' +
          '        col1: tableNameFields.col1;\n' +
          'col2: tableNameFields.col2;\n' +
          '\n' +
          '        }\n' +
          '    ',
      );
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

  describe.only('generateEnumType', () => {
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
