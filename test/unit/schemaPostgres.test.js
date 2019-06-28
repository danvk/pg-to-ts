"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var sinon = require("sinon");
var proxyquire = require("proxyquire");
var PgPromise = require("pg-promise");
var options_1 = require("../../src/options");
var options = new options_1.default({});
var pgp = PgPromise();
describe('PostgresDatabase', function () {
    var sandbox = sinon.sandbox.create();
    var db = {
        query: sandbox.stub(),
        each: sandbox.stub(),
        map: sandbox.stub()
    };
    var PostgresDBReflection;
    var PostgresProxy;
    before(function () {
        var pgpStub = function () { return db; };
        pgpStub.as = pgp.as;
        var SchemaPostgres = proxyquire('../../src/schemaPostgres', {
            'pg-promise': function () { return pgpStub; }
        });
        PostgresDBReflection = SchemaPostgres.PostgresDatabase;
        PostgresProxy = new PostgresDBReflection();
    });
    beforeEach(function () {
        sandbox.reset();
    });
    after(function () {
        sandbox.restore();
    });
    describe('query', function () {
        it('calls postgres query', function () {
            PostgresProxy.query('SELECT * FROM TEST');
            assert.equal(db.query.getCall(0).args[0], 'SELECT * FROM TEST');
        });
    });
    describe('getEnumTypes', function () {
        it('writes correct query with schema name', function () {
            PostgresProxy.getEnumTypes('schemaName');
            assert.equal(db.each.getCall(0).args[0], 'select n.nspname as schema, t.typname as name, e.enumlabel as value ' +
                'from pg_type t join pg_enum e on t.oid = e.enumtypid ' +
                'join pg_catalog.pg_namespace n ON n.oid = t.typnamespace ' +
                'where n.nspname = \'schemaName\' ' +
                'order by t.typname asc, e.enumlabel asc;');
            assert.deepEqual(db.each.getCall(0).args[1], []);
        });
        it('writes correct query without schema name', function () {
            PostgresProxy.getEnumTypes();
            assert.equal(db.each.getCall(0).args[0], 'select n.nspname as schema, t.typname as name, e.enumlabel as value ' +
                'from pg_type t join pg_enum e on t.oid = e.enumtypid ' +
                'join pg_catalog.pg_namespace n ON n.oid = t.typnamespace  ' +
                'order by t.typname asc, e.enumlabel asc;');
            assert.deepEqual(db.each.getCall(0).args[1], []);
        });
        it('handles response from db', function () { return __awaiter(_this, void 0, void 0, function () {
            var enums, callback, dbResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PostgresProxy.getEnumTypes()];
                    case 1:
                        enums = _a.sent();
                        callback = db.each.getCall(0).args[2];
                        dbResponse = [
                            { name: 'name', value: 'value1' },
                            { name: 'name', value: 'value2' }
                        ];
                        dbResponse.forEach(callback);
                        assert.deepEqual(enums, { name: ['value1', 'value2'] });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('getTableDefinition', function () {
        it('writes correct query', function () {
            PostgresProxy.getTableDefinition('tableName', 'schemaName');
            assert.equal(db.each.getCall(0).args[0], 'SELECT column_name, udt_name, is_nullable ' +
                'FROM information_schema.columns ' +
                'WHERE table_name = $1 and table_schema = $2');
            assert.deepEqual(db.each.getCall(0).args[1], ['tableName', 'schemaName']);
        });
        it('handles response from db', function () { return __awaiter(_this, void 0, void 0, function () {
            var tableDefinition, callback, dbResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PostgresProxy.getTableDefinition()];
                    case 1:
                        tableDefinition = _a.sent();
                        callback = db.each.getCall(0).args[2];
                        dbResponse = [
                            { column_name: 'col1', udt_name: 'int2', is_nullable: 'YES' },
                            { column_name: 'col2', udt_name: 'text', is_nullable: 'NO' }
                        ];
                        dbResponse.forEach(callback);
                        assert.deepEqual(tableDefinition, {
                            col1: { udtName: 'int2', nullable: true },
                            col2: { udtName: 'text', nullable: false }
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('getTableTypes', function () {
        var tableTypesSandbox = sinon.sandbox.create();
        before(function () {
            tableTypesSandbox.stub(PostgresProxy, 'getEnumTypes');
            tableTypesSandbox.stub(PostgresProxy, 'getTableDefinition');
            tableTypesSandbox.stub(PostgresDBReflection, 'mapTableDefinitionToType');
        });
        beforeEach(function () {
            tableTypesSandbox.reset();
        });
        after(function () {
            tableTypesSandbox.restore();
        });
        it('gets custom types from enums', function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        PostgresProxy.getEnumTypes.returns(Promise.resolve({ enum1: [], enum2: [] }));
                        PostgresProxy.getTableDefinition.returns(Promise.resolve({}));
                        return [4 /*yield*/, PostgresProxy.getTableTypes('tableName', 'tableSchema')];
                    case 1:
                        _a.sent();
                        assert.deepEqual(PostgresDBReflection.mapTableDefinitionToType.getCall(0).args[1], ['enum1', 'enum2']);
                        return [2 /*return*/];
                }
            });
        }); });
        it('gets table definitions', function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        PostgresProxy.getEnumTypes.returns(Promise.resolve({}));
                        PostgresProxy.getTableDefinition.returns(Promise.resolve({ table: {
                                udtName: 'name',
                                nullable: false
                            } }));
                        return [4 /*yield*/, PostgresProxy.getTableTypes('tableName', 'tableSchema')];
                    case 1:
                        _a.sent();
                        assert.deepEqual(PostgresProxy.getTableDefinition.getCall(0).args, ['tableName', 'tableSchema']);
                        assert.deepEqual(PostgresDBReflection.mapTableDefinitionToType.getCall(0).args[0], { table: {
                                udtName: 'name',
                                nullable: false
                            } });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('getSchemaTables', function () {
        it('writes correct query', function () {
            PostgresProxy.getSchemaTables('schemaName');
            assert.equal(db.map.getCall(0).args[0], 'SELECT table_name ' +
                'FROM information_schema.columns ' +
                'WHERE table_schema = $1 ' +
                'GROUP BY table_name');
            assert.deepEqual(db.map.getCall(0).args[1], ['schemaName']);
        });
        it('handles response from db', function () { return __awaiter(_this, void 0, void 0, function () {
            var callback, dbResponse, schemaTables;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PostgresProxy.getSchemaTables()];
                    case 1:
                        _a.sent();
                        callback = db.map.getCall(0).args[2];
                        dbResponse = [
                            { table_name: 'table1' },
                            { table_name: 'table2' }
                        ];
                        schemaTables = dbResponse.map(callback);
                        assert.deepEqual(schemaTables, ['table1', 'table2']);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('mapTableDefinitionToType', function () {
        describe('maps to string', function () {
            it('bpchar', function () {
                var td = {
                    column: {
                        udtName: 'bpchar',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'string');
            });
            it('char', function () {
                var td = {
                    column: {
                        udtName: 'char',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'string');
            });
            it('varchar', function () {
                var td = {
                    column: {
                        udtName: 'varchar',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'string');
            });
            it('text', function () {
                var td = {
                    column: {
                        udtName: 'text',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'string');
            });
            it('citext', function () {
                var td = {
                    column: {
                        udtName: 'citext',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'string');
            });
            it('uuid', function () {
                var td = {
                    column: {
                        udtName: 'uuid',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'string');
            });
            it('bytea', function () {
                var td = {
                    column: {
                        udtName: 'bytea',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'string');
            });
            it('inet', function () {
                var td = {
                    column: {
                        udtName: 'inet',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'string');
            });
            it('time', function () {
                var td = {
                    column: {
                        udtName: 'time',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'string');
            });
            it('timetz', function () {
                var td = {
                    column: {
                        udtName: 'timetz',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'string');
            });
            it('interval', function () {
                var td = {
                    column: {
                        udtName: 'interval',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'string');
            });
            it('name', function () {
                var td = {
                    column: {
                        udtName: 'name',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'string');
            });
        });
        describe('maps to number', function () {
            it('int2', function () {
                var td = {
                    column: {
                        udtName: 'int2',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'number');
            });
            it('int4', function () {
                var td = {
                    column: {
                        udtName: 'int4',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'number');
            });
            it('int8', function () {
                var td = {
                    column: {
                        udtName: 'int8',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'number');
            });
            it('float4', function () {
                var td = {
                    column: {
                        udtName: 'float4',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'number');
            });
            it('float8', function () {
                var td = {
                    column: {
                        udtName: 'float8',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'number');
            });
            it('numeric', function () {
                var td = {
                    column: {
                        udtName: 'numeric',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'number');
            });
            it('money', function () {
                var td = {
                    column: {
                        udtName: 'money',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'number');
            });
            it('oid', function () {
                var td = {
                    column: {
                        udtName: 'oid',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'number');
            });
        });
        describe('maps to boolean', function () {
            it('bool', function () {
                var td = {
                    column: {
                        udtName: 'bool',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'boolean');
            });
        });
        describe('maps to Object', function () {
            it('json', function () {
                var td = {
                    column: {
                        udtName: 'json',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Object');
            });
            it('jsonb', function () {
                var td = {
                    column: {
                        udtName: 'jsonb',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Object');
            });
        });
        describe('maps to Date', function () {
            it('date', function () {
                var td = {
                    column: {
                        udtName: 'date',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Date');
            });
            it('timestamp', function () {
                var td = {
                    column: {
                        udtName: 'timestamp',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Date');
            });
            it('timestamptz', function () {
                var td = {
                    column: {
                        udtName: 'timestamptz',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Date');
            });
        });
        describe('maps to Array<number>', function () {
            it('_int2', function () {
                var td = {
                    column: {
                        udtName: '_int2',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Array<number>');
            });
            it('_int4', function () {
                var td = {
                    column: {
                        udtName: '_int4',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Array<number>');
            });
            it('_int8', function () {
                var td = {
                    column: {
                        udtName: '_int8',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Array<number>');
            });
            it('_float4', function () {
                var td = {
                    column: {
                        udtName: '_float4',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Array<number>');
            });
            it('_float8', function () {
                var td = {
                    column: {
                        udtName: '_float8',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Array<number>');
            });
            it('_numeric', function () {
                var td = {
                    column: {
                        udtName: '_numeric',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Array<number>');
            });
            it('_money', function () {
                var td = {
                    column: {
                        udtName: '_money',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Array<number>');
            });
        });
        describe('maps to Array<boolean>', function () {
            it('_bool', function () {
                var td = {
                    column: {
                        udtName: '_bool',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, ['CustomType'], options).column.tsType, 'Array<boolean>');
            });
        });
        describe('maps to Array<string>', function () {
            it('_varchar', function () {
                var td = {
                    column: {
                        udtName: '_varchar',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, ['CustomType'], options).column.tsType, 'Array<string>');
            });
            it('_text', function () {
                var td = {
                    column: {
                        udtName: '_text',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, ['CustomType'], options).column.tsType, 'Array<string>');
            });
            it('_citext', function () {
                var td = {
                    column: {
                        udtName: '_citext',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, ['CustomType'], options).column.tsType, 'Array<string>');
            });
            it('_uuid', function () {
                var td = {
                    column: {
                        udtName: '_uuid',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, ['CustomType'], options).column.tsType, 'Array<string>');
            });
            it('_bytea', function () {
                var td = {
                    column: {
                        udtName: '_bytea',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, ['CustomType'], options).column.tsType, 'Array<string>');
            });
        });
        describe('maps to Array<Object>', function () {
            it('_json', function () {
                var td = {
                    column: {
                        udtName: '_json',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Array<Object>');
            });
            it('_jsonb', function () {
                var td = {
                    column: {
                        udtName: '_jsonb',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Array<Object>');
            });
        });
        describe('maps to Array<Date>', function () {
            it('_timestamptz', function () {
                var td = {
                    column: {
                        udtName: '_timestamptz',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Array<Date>');
            });
        });
        describe('maps to custom', function () {
            it('CustomType', function () {
                var td = {
                    column: {
                        udtName: 'CustomType',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, ['CustomType'], options).column.tsType, 'CustomType');
            });
        });
        describe('maps to any', function () {
            it('UnknownType', function () {
                var td = {
                    column: {
                        udtName: 'UnknownType',
                        nullable: false
                    }
                };
                assert.equal(PostgresDBReflection.mapTableDefinitionToType(td, ['CustomType'], options).column.tsType, 'any');
            });
        });
    });
});
//# sourceMappingURL=schemaPostgres.test.js.map