"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var TypeScript = __importStar(require("../../src/typescript"));
var options_1 = __importDefault(require("../../src/options"));
var options = new options_1.default({});
var schemaName = 'schemanamehere';
describe('TypeScript', function () {
    describe('generateTableInterface', function () {
        it('empty table definition object', function () {
            var _a = TypeScript.generateTableInterface('tableName', {
                columns: {},
                primaryKey: null,
            }, options, schemaName), tableInterface = _a[0], types = _a[1];
            expect(tableInterface).toEqual("\n      // Table tableName\n       export interface TableName {\n        }\n       export interface TableNameInput {\n        }\n      const tableName = {\n        tableName: 'tableName',\n        columns: [],\n        requiredForInsert: [],\n        primaryKey: null,\n        foreignKeys: {},\n      } as const;\n  ");
            expect(types).toEqual(new Set());
        });
        it('table name is reserved', function () {
            var _a = TypeScript.generateTableInterface('package', {
                columns: {},
                primaryKey: null,
            }, options, schemaName), tableInterface = _a[0], types = _a[1];
            expect(tableInterface).toEqual("\n      // Table package\n       export interface Package {\n        }\n       export interface PackageInput {\n        }\n      const package_ = {\n        tableName: 'package',\n        columns: [],\n        requiredForInsert: [],\n        primaryKey: null,\n        foreignKeys: {},\n      } as const;\n  ");
            expect(types).toEqual(new Set());
        });
        it('table with columns', function () {
            var _a = TypeScript.generateTableInterface('tableName', {
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
            }, options, schemaName), tableInterface = _a[0], types = _a[1];
            // TODO(danvk): fix spacing in output
            expect(tableInterface).toEqual("\n      // Table tableName\n       export interface TableName {\n        col1: string;\ncol2: boolean;\n}\n       export interface TableNameInput {\n        col1: string;\ncol2: boolean;\n}\n      const tableName = {\n        tableName: 'tableName',\n        columns: ['col1', 'col2'],\n        requiredForInsert: ['col1', 'col2'],\n        primaryKey: null,\n        foreignKeys: {},\n      } as const;\n  ");
            expect(types).toEqual(new Set());
        });
        it('table with reserved columns', function () {
            var _a = TypeScript.generateTableInterface('tableName', {
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
            }, options, schemaName), tableInterface = _a[0], types = _a[1];
            // TODO(danvk): what exactly is this testing?
            expect(tableInterface).toEqual("\n      // Table tableName\n       export interface TableName {\n        string: string;\nnumber: number;\npackage: boolean;\n}\n       export interface TableNameInput {\n        string: string;\nnumber: number;\npackage: boolean;\n}\n      const tableName = {\n        tableName: 'tableName',\n        columns: ['string', 'number', 'package'],\n        requiredForInsert: ['string', 'number', 'package'],\n        primaryKey: null,\n        foreignKeys: {},\n      } as const;\n  ");
            expect(types).toEqual(new Set());
        });
    });
    describe('generateEnumType', function () {
        it('empty object', function () {
            var enumType = TypeScript.generateEnumType({}, options);
            expect(enumType).toEqual('');
        });
        it('with enumerations', function () {
            var enumType = TypeScript.generateEnumType({
                enum1: ['val1', 'val2', 'val3', 'val4'],
                enum2: ['val5', 'val6', 'val7', 'val8'],
            }, options);
            expect(enumType).toEqual("export type enum1 = 'val1' | 'val2' | 'val3' | 'val4';\n" +
                "export type enum2 = 'val5' | 'val6' | 'val7' | 'val8';\n");
        });
    });
});
//# sourceMappingURL=typescript.test.js.map