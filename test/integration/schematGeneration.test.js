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
var assert = require("power-assert");
var index_1 = require("../../src/index");
var testUtility_1 = require("../testUtility");
describe('schemat generation integration testing', function () {
    describe('postgres', function () {
        var db;
        before(function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!process.env.POSTGRES_URL) {
                                return [2 /*return*/, this.skip()];
                            }
                            db = index_1.getDatabase(process.env.POSTGRES_URL);
                            return [4 /*yield*/, testUtility_1.loadSchema(db, './test/fixture/postgres/initCleanup.sql')];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        });
        it('Basic generation', function () { return __awaiter(_this, void 0, void 0, function () {
            var inputSQLFile, outputFile, expectedFile, config, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        inputSQLFile = 'test/fixture/postgres/osm.sql';
                        outputFile = './test/actual/postgres/osm.ts';
                        expectedFile = './test/expected/postgres/osm.ts';
                        config = './fixture/postgres/osm.json';
                        return [4 /*yield*/, testUtility_1.writeTsFile(inputSQLFile, config, outputFile, db)];
                    case 1:
                        _b.sent();
                        _a = assert;
                        return [4 /*yield*/, testUtility_1.compare(expectedFile, outputFile)];
                    case 2: return [2 /*return*/, _a.apply(void 0, [_b.sent()])];
                }
            });
        }); });
        it('Camelcase generation', function () { return __awaiter(_this, void 0, void 0, function () {
            var inputSQLFile, outputFile, expectedFile, config, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        inputSQLFile = 'test/fixture/postgres/osm.sql';
                        outputFile = './test/actual/postgres/osm-camelcase.ts';
                        expectedFile = './test/expected/postgres/osm-camelcase.ts';
                        config = './fixture/postgres/osm-camelcase.json';
                        return [4 /*yield*/, testUtility_1.writeTsFile(inputSQLFile, config, outputFile, db)];
                    case 1:
                        _b.sent();
                        _a = assert;
                        return [4 /*yield*/, testUtility_1.compare(expectedFile, outputFile)];
                    case 2: return [2 /*return*/, _a.apply(void 0, [_b.sent()])];
                }
            });
        }); });
    });
    describe('mysql', function () {
        var db;
        before(function () {
            return __awaiter(this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            if (!process.env.MYSQL_URL) {
                                return [2 /*return*/, this.skip()];
                            }
                            db = index_1.getDatabase(process.env.MYSQL_URL + "?multipleStatements=true");
                            return [4 /*yield*/, testUtility_1.loadSchema(db, './test/fixture/mysql/initCleanup.sql')];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            });
        });
        it('Basic generation', function () { return __awaiter(_this, void 0, void 0, function () {
            var inputSQLFile, outputFile, expectedFile, config, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        inputSQLFile = 'test/fixture/mysql/osm.sql';
                        outputFile = './test/actual/mysql/osm.ts';
                        expectedFile = './test/expected/mysql/osm.ts';
                        config = './fixture/mysql/osm.json';
                        return [4 /*yield*/, testUtility_1.writeTsFile(inputSQLFile, config, outputFile, db)];
                    case 1:
                        _b.sent();
                        _a = assert;
                        return [4 /*yield*/, testUtility_1.compare(expectedFile, outputFile)];
                    case 2: return [2 /*return*/, _a.apply(void 0, [_b.sent()])];
                }
            });
        }); });
        it('Enum conflict in columns', function () { return __awaiter(_this, void 0, void 0, function () {
            var inputSQLFile, outputFile, config, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        inputSQLFile = 'test/fixture/mysql/conflict.sql';
                        outputFile = './test/actual/mysql/conflict.ts';
                        config = './fixture/mysql/conflict.json';
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, testUtility_1.writeTsFile(inputSQLFile, config, outputFile, db)];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        e_1 = _a.sent();
                        assert.equal(e_1.message, 'Multiple enums with the same name and contradicting types were found: location_type: ["city","province","country"] and ["city","state","country"]');
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
    });
});
//# sourceMappingURL=schematGeneration.test.js.map