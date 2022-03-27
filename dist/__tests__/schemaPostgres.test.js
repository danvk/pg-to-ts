"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var options_1 = __importDefault(require("../../src/options"));
var schemaPostgres_1 = require("../../src/schemaPostgres");
jest.mock('pg-promise', function () {
    var mClient = {
        connect: jest.fn(),
        query: jest.fn(),
        each: jest.fn(),
        map: jest.fn(),
        end: jest.fn(),
    };
    return jest.fn(function () {
        var mock = function () { return mClient; };
        mock.as = jest.requireActual('pg-promise').as; // this is used for formatting
        return mock;
    });
});
var options = new options_1.default({});
describe('PostgresDatabase', function () {
    var pg;
    var mockedDb;
    beforeEach(function () {
        jest.resetModules();
        jest.resetAllMocks();
        pg = new schemaPostgres_1.PostgresDatabase('conn');
        mockedDb = pg.db;
    });
    describe('query', function () {
        it('calls postgres query', function () {
            mockedDb.query.mockResolvedValueOnce({ rows: [], rowCount: 0 });
            pg.query('SELECT * FROM TEST');
            expect(pg.db.query).toBeCalledWith('SELECT * FROM TEST');
        });
    });
    describe('getEnumTypes', function () {
        it('writes correct query with schema name', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockedDb.each.mockResolvedValueOnce([]);
                        return [4 /*yield*/, pg.getEnumTypes('schemaName')];
                    case 1:
                        _a.sent();
                        expect(pg.db.each).toHaveBeenCalledWith('select n.nspname as schema, t.typname as name, e.enumlabel as value ' +
                            'from pg_type t join pg_enum e on t.oid = e.enumtypid ' +
                            'join pg_catalog.pg_namespace n ON n.oid = t.typnamespace ' +
                            "where n.nspname = 'schemaName' " +
                            'order by t.typname asc, e.enumlabel asc;', [], expect.any(Function));
                        return [2 /*return*/];
                }
            });
        }); });
        it('writes correct query without schema name', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockedDb.each.mockResolvedValueOnce([]);
                        return [4 /*yield*/, pg.getEnumTypes()];
                    case 1:
                        _a.sent();
                        expect(pg.db.each).toHaveBeenCalledWith('select n.nspname as schema, t.typname as name, e.enumlabel as value ' +
                            'from pg_type t join pg_enum e on t.oid = e.enumtypid ' +
                            'join pg_catalog.pg_namespace n ON n.oid = t.typnamespace  ' +
                            'order by t.typname asc, e.enumlabel asc;', [], expect.any(Function));
                        return [2 /*return*/];
                }
            });
        }); });
        it('handles response from db', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dbResponse, enums;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dbResponse = [
                            { name: 'name', value: 'value1' },
                            { name: 'name', value: 'value2' },
                        ];
                        mockedDb.each = jest.fn().mockImplementation(function (query, args, callback) {
                            dbResponse.forEach(callback);
                        });
                        return [4 /*yield*/, pg.getEnumTypes()];
                    case 1:
                        enums = _a.sent();
                        expect(enums).toEqual({ name: ['value1', 'value2'] });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('getSchemaTables', function () {
        it('writes correct query', function () { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockedDb.map.mockResolvedValueOnce([]);
                        return [4 /*yield*/, pg.getSchemaTables('schemaName')];
                    case 1:
                        _a.sent();
                        expect(pg.db.map).toHaveBeenCalledWith('SELECT table_name ' +
                            'FROM information_schema.columns ' +
                            'WHERE table_schema = $1 ' +
                            'GROUP BY table_name ORDER BY lower(table_name)', ['schemaName'], expect.any(Function));
                        return [2 /*return*/];
                }
            });
        }); });
        it('handles response from db', function () { return __awaiter(void 0, void 0, void 0, function () {
            var dbResponse, schemaTables;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dbResponse = [{ table_name: 'table1' }, { table_name: 'table2' }];
                        schemaTables = [];
                        mockedDb.map = jest.fn().mockImplementation(function (query, args, callback) {
                            schemaTables = dbResponse.map(callback);
                        });
                        return [4 /*yield*/, pg.getSchemaTables('schema')];
                    case 1:
                        _a.sent();
                        expect(schemaTables).toEqual(['table1', 'table2']);
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe('pgTypeToTsType', function () {
        it('maps to string', function () {
            for (var _i = 0, _a = [
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
            ]; _i < _a.length; _i++) {
                var udtName = _a[_i];
                var td = {
                    udtName: udtName,
                    nullable: false,
                    hasDefault: false,
                };
                expect((0, schemaPostgres_1.pgTypeToTsType)(td, [], options)).toEqual('string');
            }
        });
        it('maps to number', function () {
            for (var _i = 0, _a = [
                'int2',
                'int4',
                'int8',
                'float4',
                'float8',
                'numeric',
                'money',
                'oid',
            ]; _i < _a.length; _i++) {
                var udtName = _a[_i];
                var td = {
                    udtName: udtName,
                    nullable: false,
                    hasDefault: false,
                };
                expect((0, schemaPostgres_1.pgTypeToTsType)(td, [], options)).toEqual('number');
            }
        });
        it('maps to boolean', function () {
            var td = {
                udtName: 'bool',
                nullable: false,
                hasDefault: false,
            };
            expect((0, schemaPostgres_1.pgTypeToTsType)(td, [], options)).toEqual('boolean');
        });
        it('maps to Object', function () {
            for (var _i = 0, _a = ['json', 'jsonb']; _i < _a.length; _i++) {
                var udtName = _a[_i];
                var td = {
                    udtName: udtName,
                    nullable: false,
                    hasDefault: false,
                };
                expect((0, schemaPostgres_1.pgTypeToTsType)(td, [], options)).toEqual('Json');
            }
        });
        it('maps to Date', function () {
            for (var _i = 0, _a = ['date', 'timestamp', 'timestamptz']; _i < _a.length; _i++) {
                var udtName = _a[_i];
                var td = {
                    udtName: udtName,
                    nullable: false,
                    hasDefault: false,
                };
                expect((0, schemaPostgres_1.pgTypeToTsType)(td, [], options)).toEqual('Date');
            }
        });
        it('maps to number[]', function () {
            for (var _i = 0, _a = [
                '_int2',
                '_int4',
                '_int8',
                '_float4',
                '_float8',
                '_numeric',
                '_money',
            ]; _i < _a.length; _i++) {
                var udtName = _a[_i];
                var td = {
                    udtName: udtName,
                    nullable: false,
                    hasDefault: false,
                };
                expect((0, schemaPostgres_1.pgTypeToTsType)(td, [], options)).toEqual('number[]');
            }
        });
    });
    describe('mapTableDefinitionToType', function () {
        it('adds TS types to a table definition', function () {
            expect(schemaPostgres_1.PostgresDatabase.mapTableDefinitionToType({
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
            }, ['CustomType'], options).columns).toEqual({
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
//# sourceMappingURL=schemaPostgres.test.js.map