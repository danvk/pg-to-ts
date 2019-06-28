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
var mysql = require("mysql");
var schemaMysql_1 = require("../../src/schemaMysql");
var options_1 = require("../../src/options");
var options = new options_1.default({});
var MysqlDBReflection = schemaMysql_1.MysqlDatabase;
describe('MysqlDatabase', function () {
    var db;
    var sandbox = sinon.sandbox.create();
    before(function () {
        sandbox.stub(mysql, 'createConnection');
        sandbox.stub(MysqlDBReflection.prototype, 'queryAsync');
        db = new schemaMysql_1.MysqlDatabase('mysql://user:password@localhost/test');
    });
    beforeEach(function () {
        sandbox.reset();
    });
    after(function () {
        sandbox.restore();
    });
    describe('query', function () {
        it('query calls query async', function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, db.query('SELECT * FROM test_table')];
                    case 1:
                        _a.sent();
                        assert.deepEqual(MysqlDBReflection.prototype.queryAsync.getCall(0).args, ['SELECT * FROM test_table']);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('queryAsync', function () {
        before(function () {
            MysqlDBReflection.prototype.queryAsync.restore();
        });
        after(function () {
            sandbox.stub(MysqlDBReflection.prototype, 'queryAsync');
        });
        it('query has error', function () { return __awaiter(_this, void 0, void 0, function () {
            var testDb;
            return __generator(this, function (_a) {
                mysql.createConnection.returns({
                    query: function query(queryString, params, cb) {
                        cb('ERROR');
                    }
                });
                testDb = new schemaMysql_1.MysqlDatabase('mysql://user:password@localhost/test');
                try {
                    testDb.query('SELECT * FROM test_table');
                }
                catch (e) {
                    assert.equal(e, 'ERROR');
                }
                return [2 /*return*/];
            });
        }); });
        it('query returns with results', function () { return __awaiter(_this, void 0, void 0, function () {
            var testDb, results;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mysql.createConnection.returns({
                            query: function query(queryString, params, cb) {
                                cb(null, []);
                            }
                        });
                        testDb = new schemaMysql_1.MysqlDatabase('mysql://user:password@localhost/test');
                        return [4 /*yield*/, testDb.query('SELECT * FROM test_table')];
                    case 1:
                        results = _a.sent();
                        assert.deepEqual(results, []);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('getEnumTypes', function () {
        it('writes correct query with schema name', function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        MysqlDBReflection.prototype.queryAsync.returns(Promise.resolve([]));
                        return [4 /*yield*/, db.getEnumTypes('testschema')];
                    case 1:
                        _a.sent();
                        assert.deepEqual(MysqlDBReflection.prototype.queryAsync.getCall(0).args, [
                            'SELECT column_name, column_type, data_type ' +
                                'FROM information_schema.columns ' +
                                'WHERE data_type IN (\'enum\', \'set\') and table_schema = ?',
                            ['testschema']
                        ]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('writes correct query without schema name', function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        MysqlDBReflection.prototype.queryAsync.returns(Promise.resolve([]));
                        return [4 /*yield*/, db.getEnumTypes()];
                    case 1:
                        _a.sent();
                        assert.deepEqual(MysqlDBReflection.prototype.queryAsync.getCall(0).args, [
                            'SELECT column_name, column_type, data_type ' +
                                'FROM information_schema.columns ' +
                                'WHERE data_type IN (\'enum\', \'set\') ',
                            []
                        ]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('handles response', function () { return __awaiter(_this, void 0, void 0, function () {
            var enumTypes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        MysqlDBReflection.prototype.queryAsync.returns(Promise.resolve([
                            { column_name: 'column1', column_type: 'enum(\'enum1\')', data_type: 'enum' },
                            { column_name: 'column2', column_type: 'set(\'set1\')', data_type: 'set' }
                        ]));
                        return [4 /*yield*/, db.getEnumTypes('testschema')];
                    case 1:
                        enumTypes = _a.sent();
                        assert.deepEqual(enumTypes, {
                            enum_column1: ['enum1'],
                            set_column2: ['set1']
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('same column same value is accepted', function () { return __awaiter(_this, void 0, void 0, function () {
            var enumTypes;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        MysqlDBReflection.prototype.queryAsync.returns(Promise.resolve([
                            { column_name: 'column1', column_type: 'enum(\'enum1\',\'enum2\')', data_type: 'enum' },
                            { column_name: 'column1', column_type: 'enum(\'enum1\',\'enum2\')', data_type: 'enum' }
                        ]));
                        return [4 /*yield*/, db.getEnumTypes('testschema')];
                    case 1:
                        enumTypes = _a.sent();
                        assert.deepEqual(enumTypes, {
                            enum_column1: ['enum1', 'enum2']
                        });
                        return [2 /*return*/];
                }
            });
        }); });
        it('same column different value conflict', function () { return __awaiter(_this, void 0, void 0, function () {
            var e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        MysqlDBReflection.prototype.queryAsync.returns(Promise.resolve([
                            { column_name: 'column1', column_type: 'enum(\'enum1\')', data_type: 'enum' },
                            { column_name: 'column1', column_type: 'enum(\'enum2\')', data_type: 'enum' }
                        ]));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, db.getEnumTypes('testschema')];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        assert.equal(e_1.message, 'Multiple enums with the same name and contradicting types were found: column1: ["enum1"] and ["enum2"]');
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
    });
    describe('getTableDefinitions', function () {
        it('writes correct query', function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        MysqlDBReflection.prototype.queryAsync.returns(Promise.resolve([]));
                        return [4 /*yield*/, db.getTableDefinition('testtable', 'testschema')];
                    case 1:
                        _a.sent();
                        assert.deepEqual(MysqlDBReflection.prototype.queryAsync.getCall(0).args, [
                            'SELECT column_name, data_type, is_nullable ' +
                                'FROM information_schema.columns ' +
                                'WHERE table_name = ? and table_schema = ?',
                            ['testtable', 'testschema']
                        ]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('handles response', function () { return __awaiter(_this, void 0, void 0, function () {
            var schemaTables;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        MysqlDBReflection.prototype.queryAsync.returns(Promise.resolve([
                            { column_name: 'column1', data_type: 'data1', is_nullable: 'NO' },
                            { column_name: 'column2', data_type: 'enum', is_nullable: 'YES' },
                            { column_name: 'column3', data_type: 'set', is_nullable: 'YES' }
                        ]));
                        return [4 /*yield*/, db.getTableDefinition('testtable', 'testschema')];
                    case 1:
                        schemaTables = _a.sent();
                        assert.deepEqual(schemaTables, {
                            column1: { udtName: 'data1', nullable: false },
                            column2: { udtName: 'enum_column2', nullable: true },
                            column3: { udtName: 'set_column3', nullable: true }
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('getTableTypes', function () {
        var tableTypesSandbox = sinon.sandbox.create();
        before(function () {
            tableTypesSandbox.stub(MysqlDBReflection.prototype, 'getEnumTypes');
            tableTypesSandbox.stub(MysqlDBReflection.prototype, 'getTableDefinition');
            tableTypesSandbox.stub(MysqlDBReflection, 'mapTableDefinitionToType');
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
                        MysqlDBReflection.prototype.getEnumTypes.returns(Promise.resolve({ enum1: [], enum2: [] }));
                        MysqlDBReflection.prototype.getTableDefinition.returns(Promise.resolve({}));
                        return [4 /*yield*/, db.getTableTypes('tableName', 'tableSchema', options)];
                    case 1:
                        _a.sent();
                        assert.deepEqual(MysqlDBReflection.mapTableDefinitionToType.getCall(0).args[1], ['enum1', 'enum2']);
                        return [2 /*return*/];
                }
            });
        }); });
        it('gets table definitions', function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        MysqlDBReflection.prototype.getEnumTypes.returns(Promise.resolve({}));
                        MysqlDBReflection.prototype.getTableDefinition.returns(Promise.resolve({ table: {
                                udtName: 'name',
                                nullable: false
                            } }));
                        return [4 /*yield*/, db.getTableTypes('tableName', 'tableSchema', options)];
                    case 1:
                        _a.sent();
                        assert.deepEqual(MysqlDBReflection.prototype.getTableDefinition.getCall(0).args, ['tableName', 'tableSchema']);
                        assert.deepEqual(MysqlDBReflection.mapTableDefinitionToType.getCall(0).args[0], { table: {
                                udtName: 'name',
                                nullable: false
                            } });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('getSchemaTables', function () {
        it('writes correct query', function () { return __awaiter(_this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        MysqlDBReflection.prototype.queryAsync.returns(Promise.resolve([]));
                        return [4 /*yield*/, db.getSchemaTables('testschema')];
                    case 1:
                        _a.sent();
                        assert.deepEqual(MysqlDBReflection.prototype.queryAsync.getCall(0).args, [
                            'SELECT table_name ' +
                                'FROM information_schema.columns ' +
                                'WHERE table_schema = ? ' +
                                'GROUP BY table_name',
                            ['testschema']
                        ]);
                        return [2 /*return*/];
                }
            });
        }); });
        it('handles table response', function () { return __awaiter(_this, void 0, void 0, function () {
            var schemaTables;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        MysqlDBReflection.prototype.queryAsync.returns(Promise.resolve([
                            { table_name: 'table1' },
                            { table_name: 'table2' }
                        ]));
                        return [4 /*yield*/, db.getSchemaTables('testschema')];
                    case 1:
                        schemaTables = _a.sent();
                        assert.deepEqual(schemaTables, ['table1', 'table2']);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('mapTableDefinitionToType', function () {
        describe('maps to string', function () {
            it('char', function () {
                var td = {
                    column: {
                        udtName: 'char',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'string');
            });
            it('varchar', function () {
                var td = {
                    column: {
                        udtName: 'varchar',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'string');
            });
            it('text', function () {
                var td = {
                    column: {
                        udtName: 'text',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'string');
            });
            it('tinytext', function () {
                var td = {
                    column: {
                        udtName: 'tinytext',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'string');
            });
            it('mediumtext', function () {
                var td = {
                    column: {
                        udtName: 'mediumtext',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'string');
            });
            it('longtext', function () {
                var td = {
                    column: {
                        udtName: 'longtext',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'string');
            });
            it('time', function () {
                var td = {
                    column: {
                        udtName: 'time',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'string');
            });
            it('geometry', function () {
                var td = {
                    column: {
                        udtName: 'geometry',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'string');
            });
            it('set', function () {
                var td = {
                    column: {
                        udtName: 'set',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'string');
            });
            it('enum', function () {
                var td = {
                    column: {
                        udtName: 'enum',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'string');
            });
        });
        describe('maps to number', function () {
            it('integer', function () {
                var td = {
                    column: {
                        udtName: 'integer',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'number');
            });
            it('int', function () {
                var td = {
                    column: {
                        udtName: 'int',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'number');
            });
            it('smallint', function () {
                var td = {
                    column: {
                        udtName: 'smallint',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'number');
            });
            it('mediumint', function () {
                var td = {
                    column: {
                        udtName: 'mediumint',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'number');
            });
            it('bigint', function () {
                var td = {
                    column: {
                        udtName: 'bigint',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'number');
            });
            it('double', function () {
                var td = {
                    column: {
                        udtName: 'double',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'number');
            });
            it('decimal', function () {
                var td = {
                    column: {
                        udtName: 'decimal',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'number');
            });
            it('numeric', function () {
                var td = {
                    column: {
                        udtName: 'numeric',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'number');
            });
            it('float', function () {
                var td = {
                    column: {
                        udtName: 'float',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'number');
            });
            it('year', function () {
                var td = {
                    column: {
                        udtName: 'year',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'number');
            });
        });
        describe('maps to boolean', function () {
            it('tinyint', function () {
                var td = {
                    column: {
                        udtName: 'tinyint',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'boolean');
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
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Object');
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
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Date');
            });
            it('datetime', function () {
                var td = {
                    column: {
                        udtName: 'datetime',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Date');
            });
            it('timestamp', function () {
                var td = {
                    column: {
                        udtName: 'timestamp',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Date');
            });
        });
        describe('maps to Buffer', function () {
            it('tinyblob', function () {
                var td = {
                    column: {
                        udtName: 'tinyblob',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Buffer');
            });
            it('mediumblob', function () {
                var td = {
                    column: {
                        udtName: 'mediumblob',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Buffer');
            });
            it('longblob', function () {
                var td = {
                    column: {
                        udtName: 'longblob',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Buffer');
            });
            it('blob', function () {
                var td = {
                    column: {
                        udtName: 'blob',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Buffer');
            });
            it('binary', function () {
                var td = {
                    column: {
                        udtName: 'binary',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Buffer');
            });
            it('varbinary', function () {
                var td = {
                    column: {
                        udtName: 'varbinary',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Buffer');
            });
            it('bit', function () {
                var td = {
                    column: {
                        udtName: 'bit',
                        nullable: false
                    }
                };
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, [], options).column.tsType, 'Buffer');
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
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, ['CustomType'], options).column.tsType, 'CustomType');
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
                assert.equal(MysqlDBReflection.mapTableDefinitionToType(td, ['CustomType'], options).column.tsType, 'any');
            });
        });
    });
});
//# sourceMappingURL=schemaMysql.test.js.map