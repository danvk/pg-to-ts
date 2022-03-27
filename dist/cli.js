#! /usr/bin/env node
"use strict";
/**
 * Commandline interface
 * Created by xiamx on 2016-08-10.
 */
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
var yargs_1 = __importDefault(require("yargs/yargs"));
var helpers_1 = require("yargs/helpers");
var fs_1 = __importDefault(require("fs"));
var index_1 = require("./index");
var argv = (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
    .usage('Usage: $0 <command> [options]')
    .example('$0 generate -c postgres://username:password@localhost/db -t table1 -t table2 -s schema -o interface_output.ts', 'generate typescript interfaces from schema')
    .global('config')
    .default('config', 'pg-to-ts.json')
    .config()
    .env('PG_TO_TS')
    .demandCommand(1)
    .command('generate', 'Generate TypeScript matching a Postgres database', function (cmd) {
    return cmd.options({
        conn: {
            alias: 'c',
            describe: 'database connection string',
            demandOption: true,
            type: 'string',
        },
        output: {
            alias: 'o',
            describe: 'output file name',
            type: 'string',
            demandOption: true,
        },
        table: {
            alias: 't',
            describe: 'table name (may specify multiple times for multiple tables)',
            type: 'string',
            array: true,
        },
        excludedTable: {
            alias: 'x',
            describe: 'excluded table name (may specify multiple times to exclude multiple tables)',
            type: 'string',
            array: true,
        },
        schema: {
            alias: 's',
            type: 'string',
            describe: 'schema name',
        },
        camelCase: {
            alias: 'C',
            describe: 'Camel-case columns (e.g. user_id --> userId)',
            type: 'boolean',
        },
        datesAsStrings: {
            describe: 'Treat date, timestamp, and timestamptz as strings, not Dates. ' +
                'Note that you will have to ensure that this is accurate at runtime. ' +
                'See https://github.com/brianc/node-pg-types for details.',
            type: 'boolean',
        },
        prefixWithSchemaNames: {
            describe: 'Prefix the table name to the types',
            type: 'boolean',
        },
        jsonTypesFile: {
            describe: 'If a JSON column has an @type jsdoc tag in its comment, assume that ' +
                'type can be imported from this path.',
            type: 'string',
        },
        noHeader: {
            describe: 'Do not write header',
            type: 'boolean',
        },
    });
})
    .strictCommands()
    .help('h')
    .alias('h', 'help')
    .parseSync();
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var formattedOutput;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, index_1.typescriptOfSchema)(argv.conn, argv.table, argv.excludedTable, argv.schema, {
                    camelCase: argv.camelCase,
                    writeHeader: !argv.noHeader,
                    datesAsStrings: argv.datesAsStrings,
                    jsonTypesFile: argv.jsonTypesFile,
                    prefixWithSchemaNames: argv.prefixWithSchemaNames,
                })];
            case 1:
                formattedOutput = _a.sent();
                fs_1.default.writeFileSync(argv.output, formattedOutput);
                return [2 /*return*/];
        }
    });
}); })()
    .then(function () {
    process.exit();
})
    .catch(function (e) {
    console.warn(e);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map