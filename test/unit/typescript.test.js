"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var Typescript = require("../../src/typescript");
var options_1 = require("../../src/options");
var options = new options_1.default({});
describe('Typescript', function () {
    describe('generateTableInterface', function () {
        it('empty table definition object', function () {
            var tableInterface = Typescript.generateTableInterface('tableName', {}, options);
            assert.equal(tableInterface, '\n' +
                '        export interface tableName {\n' +
                '        \n' +
                '        }\n' +
                '    ');
        });
        it('table name is reserved', function () {
            var tableInterface = Typescript.generateTableInterface('package', {}, options);
            assert.equal(tableInterface, '\n' +
                '        export interface package_ {\n' +
                '        \n' +
                '        }\n' +
                '    ');
        });
        it('table with columns', function () {
            var tableInterface = Typescript.generateTableInterface('tableName', {
                col1: { udtName: 'name1', nullable: false },
                col2: { udtName: 'name2', nullable: false }
            }, options);
            assert.equal(tableInterface, '\n' +
                '        export interface tableName {\n' +
                '        col1: tableNameFields.col1;\n' +
                'col2: tableNameFields.col2;\n' +
                '\n' +
                '        }\n' +
                '    ');
        });
        it('table with reserved columns', function () {
            var tableInterface = Typescript.generateTableInterface('tableName', {
                string: { udtName: 'name1', nullable: false },
                number: { udtName: 'name2', nullable: false },
                package: { udtName: 'name3', nullable: false }
            }, options);
            assert.equal(tableInterface, '\n' +
                '        export interface tableName {\n' +
                '        string: tableNameFields.string_;\n' +
                'number: tableNameFields.number_;\n' +
                'package: tableNameFields.package_;\n' +
                '\n' +
                '        }\n' +
                '    ');
        });
    });
    describe('generateEnumType', function () {
        it('empty object', function () {
            var enumType = Typescript.generateEnumType({}, options);
            assert.equal(enumType, '');
        });
        it('with enumerations', function () {
            var enumType = Typescript.generateEnumType({
                enum1: ['val1', 'val2', 'val3', 'val4'],
                enum2: ['val5', 'val6', 'val7', 'val8']
            }, options);
            assert.equal(enumType, 'export type enum1 = \'val1\' | \'val2\' | \'val3\' | \'val4\';\n' +
                'export type enum2 = \'val5\' | \'val6\' | \'val7\' | \'val8\';\n');
        });
    });
    describe('generateEnumType', function () {
        it('empty object', function () {
            var enumType = Typescript.generateEnumType({}, options);
            assert.equal(enumType, '');
        });
        it('with enumerations', function () {
            var enumType = Typescript.generateEnumType({
                enum1: ['val1', 'val2', 'val3', 'val4'],
                enum2: ['val5', 'val6', 'val7', 'val8']
            }, options);
            assert.equal(enumType, 'export type enum1 = \'val1\' | \'val2\' | \'val3\' | \'val4\';\n' +
                'export type enum2 = \'val5\' | \'val6\' | \'val7\' | \'val8\';\n');
        });
    });
    describe('generateTableTypes', function () {
        it('empty table definition object', function () {
            var tableTypes = Typescript.generateTableTypes('tableName', {}, options);
            assert.equal(tableTypes, '\n' +
                '        export namespace tableNameFields {' +
                '\n        ' +
                '\n        ' +
                '}' +
                '\n    ');
        });
        it('with table definitions', function () {
            var tableTypes = Typescript.generateTableTypes('tableName', {
                col1: { udtName: 'name1', nullable: false, tsType: 'string' },
                col2: { udtName: 'name2', nullable: false, tsType: 'number' }
            }, options);
            assert.equal(tableTypes, '\n' +
                '        export namespace tableNameFields {' +
                '\n        export type col1 = string;' +
                '\nexport type col2 = number;' +
                '\n' +
                '\n        }' +
                '\n    ');
        });
        it('with nullable column definitions', function () {
            var tableTypes = Typescript.generateTableTypes('tableName', {
                col1: { udtName: 'name1', nullable: true, tsType: 'string' },
                col2: { udtName: 'name2', nullable: true, tsType: 'number' }
            }, options);
            assert.equal(tableTypes, '\n' +
                '        export namespace tableNameFields {' +
                '\n        export type col1 = string| null;' +
                '\nexport type col2 = number| null;' +
                '\n' +
                '\n        }' +
                '\n    ');
        });
    });
});
//# sourceMappingURL=typescript.test.js.map