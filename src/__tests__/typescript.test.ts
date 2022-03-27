import * as TypeScript from '../../src/typescript';
import Options from '../../src/options';

const options = new Options({});

const schemaName = 'schemanamehere';

describe('TypeScript', () => {
  describe('generateTableInterface', () => {
    it('empty table definition object', () => {
      const [tableInterface, types] = TypeScript.generateTableInterface(
        'tableName',
        {
          columns: {},
          primaryKey: null,
        },
        options,
        schemaName,
      );
      expect(tableInterface).toEqual(
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
  `,
      );
      expect(types).toEqual(new Set());
    });

    it('table name is reserved', () => {
      const [tableInterface, types] = TypeScript.generateTableInterface(
        'package',
        {
          columns: {},
          primaryKey: null,
        },
        options,
        schemaName,
      );
      expect(tableInterface).toEqual(
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
  `,
      );
      expect(types).toEqual(new Set());
    });

    it('table with columns', () => {
      const [tableInterface, types] = TypeScript.generateTableInterface(
        'tableName',
        {
          columns: {
            col1: {
              udtName: 'char',
              tsType: 'string',
              nullable: false,
              hasDefault: false,
            },
            col2: {
              udtName: 'bool',
              tsType: 'boolean',
              nullable: false,
              hasDefault: false,
            },
          },
          primaryKey: null,
        },
        options,
        schemaName,
      );
      // TODO(danvk): fix spacing in output
      expect(tableInterface).toEqual(
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
  `,
      );
      expect(types).toEqual(new Set());
    });

    it('table with reserved columns', () => {
      const [tableInterface, types] = TypeScript.generateTableInterface(
        'tableName',
        {
          columns: {
            string: {
              udtName: 'name1',
              tsType: 'string',
              nullable: false,
              hasDefault: false,
            },
            number: {
              udtName: 'name2',
              tsType: 'number',
              nullable: false,
              hasDefault: false,
            },
            package: {
              udtName: 'name3',
              tsType: 'boolean',
              nullable: false,
              hasDefault: false,
            },
          },
          primaryKey: null,
        },
        options,
        schemaName,
      );

      // TODO(danvk): what exactly is this testing?
      expect(tableInterface).toEqual(
        `
      // Table tableName
       export interface TableName {
        string: string;
number: number;
package: boolean;
}
       export interface TableNameInput {
        string: string;
number: number;
package: boolean;
}
      const tableName = {
        tableName: 'tableName',
        columns: ['string', 'number', 'package'],
        requiredForInsert: ['string', 'number', 'package'],
        primaryKey: null,
        foreignKeys: {},
      } as const;
  `,
      );
      expect(types).toEqual(new Set());
    });
  });

  describe('generateEnumType', () => {
    it('empty object', () => {
      const enumType = TypeScript.generateEnumType({}, options);
      expect(enumType).toEqual('');
    });
    it('with enumerations', () => {
      const enumType = TypeScript.generateEnumType(
        {
          enum1: ['val1', 'val2', 'val3', 'val4'],
          enum2: ['val5', 'val6', 'val7', 'val8'],
        },
        options,
      );
      expect(enumType).toEqual(
        "export type enum1 = 'val1' | 'val2' | 'val3' | 'val4';\n" +
          "export type enum2 = 'val5' | 'val6' | 'val7' | 'val8';\n",
      );
    });
  });
});
