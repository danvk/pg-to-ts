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
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("mz/fs");
var index_1 = require("../src/index");
var ts = require("typescript");
var diff = require('diff');
function compile(fileNames, options) {
    var program = ts.createProgram(fileNames, options);
    var emitResult = program.emit();
    var exitCode = emitResult.emitSkipped ? 1 : 0;
    return exitCode === 0;
}
exports.compile = compile;
function compare(goldStandardFile, outputFile) {
    return __awaiter(this, void 0, void 0, function () {
        var gold, actual, diffs, addOrRemovedLines;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs.readFile(goldStandardFile, { encoding: 'utf8' })];
                case 1:
                    gold = _a.sent();
                    return [4 /*yield*/, fs.readFile(outputFile, { encoding: 'utf8' })];
                case 2:
                    actual = _a.sent();
                    diffs = diff.diffLines(gold, actual, { ignoreWhitespace: true, newlineIsToken: true });
                    addOrRemovedLines = diffs.filter(function (d) { return d.added || d.removed; });
                    if (addOrRemovedLines.length > 0) {
                        console.error("Generated type definition different to the standard " + goldStandardFile);
                        addOrRemovedLines.forEach(function (d, i) {
                            var t = d.added ? '+' : d.removed ? '-' : 'x';
                            console.error("  [" + i + "] " + t + " " + d.value);
                        });
                        return [2 /*return*/, false];
                    }
                    else {
                        return [2 /*return*/, true];
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.compare = compare;
function loadSchema(db, file) {
    return __awaiter(this, void 0, void 0, function () {
        var query;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fs.readFile(file, {
                        encoding: 'utf8'
                    })];
                case 1:
                    query = _a.sent();
                    return [4 /*yield*/, db.query(query)];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
exports.loadSchema = loadSchema;
function writeTsFile(inputSQLFile, inputConfigFile, outputFile, db) {
    return __awaiter(this, void 0, void 0, function () {
        var config, formattedOutput;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, loadSchema(db, inputSQLFile)];
                case 1:
                    _a.sent();
                    config = require(inputConfigFile);
                    return [4 /*yield*/, index_1.typescriptOfSchema(db, config.tables, config.schema, { camelCase: config.camelCase, writeHeader: config.writeHeader })];
                case 2:
                    formattedOutput = _a.sent();
                    return [4 /*yield*/, fs.writeFile(outputFile, formattedOutput)];
                case 3:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.writeTsFile = writeTsFile;
//# sourceMappingURL=testUtility.js.map