"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.PostgresDatabase = exports.pgTypeToTsType = void 0;
var pg_promise_1 = __importDefault(require("pg-promise"));
var lodash_1 = __importDefault(require("lodash"));
var pgp = (0, pg_promise_1.default)();
/**
 * Converts a postgres data type to a typescript
 */
function pgTypeToTsType(column, customTypes, options) {
    var udtName = column.udtName;
    switch (udtName) {
        case 'bpchar':
        case 'char':
        case 'varchar':
        case 'text':
        case 'citext':
        case 'uuid':
        case 'bytea':
        case 'inet':
        case 'time':
        case 'timetz':
        case 'interval':
        case 'name':
            return 'string';
        case 'int2':
        case 'int4':
        case 'int8':
        case 'float4':
        case 'float8':
        case 'numeric':
        case 'money':
        case 'oid':
            return 'number';
        case 'bool':
            return 'boolean';
        case 'json':
        case 'jsonb':
            return 'Json';
        case 'date':
        case 'timestamp':
        case 'timestamptz':
            return options.options.datesAsStrings ? 'string' : 'Date';
        case '_int2':
        case '_int4':
        case '_int8':
        case '_float4':
        case '_float8':
        case '_numeric':
        case '_money':
            return 'number[]';
        case '_bool':
            return 'boolean[]';
        case '_varchar':
        case '_text':
        case '_citext':
        case '_uuid':
        case '_bytea':
            return 'string[]';
        case '_json':
        case '_jsonb':
            return 'Json[]';
        case '_timestamptz':
            return 'Date[]';
        default:
            if (customTypes.includes(udtName)) {
                return options.transformTypeName(udtName);
            }
            if (udtName.startsWith('_')) {
                var singularName = udtName.slice(1);
                if (customTypes.includes(singularName)) {
                    return options.transformTypeName(singularName) + '[]';
                }
            }
            console.log("Type [".concat(column.udtName, " has been mapped to [any] because no specific type has been found."));
            return 'any';
    }
}
exports.pgTypeToTsType = pgTypeToTsType;
var PostgresDatabase = /** @class */ (function () {
    function PostgresDatabase(connectionString) {
        this.metadata = null;
        this.connectionString = connectionString;
        this.db = pgp(connectionString);
    }
    PostgresDatabase.mapTableDefinitionToType = function (tableDefinition, customTypes, options) {
        return __assign(__assign({}, tableDefinition), { columns: lodash_1.default.mapValues(tableDefinition.columns, function (column) { return (__assign(__assign({}, column), { tsType: pgTypeToTsType(column, customTypes, options) })); }) });
    };
    PostgresDatabase.prototype.query = function (queryString) {
        return this.db.query(queryString);
    };
    /** Call this if you know the DB has changed underneath you, e.g. in a test. */
    PostgresDatabase.prototype.reset = function () {
        this.metadata = null;
    };
    PostgresDatabase.prototype.getEnumTypes = function (schema) {
        return __awaiter(this, void 0, void 0, function () {
            var enums, enumSchemaWhereClause;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        enums = {};
                        enumSchemaWhereClause = schema
                            ? pgp.as.format("where n.nspname = $1", schema)
                            : '';
                        return [4 /*yield*/, this.db.each('select n.nspname as schema, t.typname as name, e.enumlabel as value ' +
                                'from pg_type t ' +
                                'join pg_enum e on t.oid = e.enumtypid ' +
                                'join pg_catalog.pg_namespace n ON n.oid = t.typnamespace ' +
                                "".concat(enumSchemaWhereClause, " ") +
                                'order by t.typname asc, e.enumlabel asc;', [], function (item) {
                                if (!enums[item.name]) {
                                    enums[item.name] = [];
                                }
                                enums[item.name].push(item.value);
                            })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, enums];
                }
            });
        });
    };
    PostgresDatabase.prototype.getTableDefinition = function (tableName, tableSchema) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, tableToKeys, columnComments, tableComments, foreignKeys, tableDefinition, tableComment, comments, fkeys;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.getMeta(tableSchema)];
                    case 1:
                        _a = _b.sent(), tableToKeys = _a.tableToKeys, columnComments = _a.columnComments, tableComments = _a.tableComments, foreignKeys = _a.foreignKeys;
                        tableDefinition = {
                            columns: {},
                            primaryKey: tableToKeys[tableName] || null,
                        };
                        tableComment = tableComments[tableName];
                        if (tableComment) {
                            tableDefinition.comment = tableComment;
                        }
                        comments = columnComments[tableName] || {};
                        fkeys = foreignKeys[tableName] || {};
                        return [4 /*yield*/, this.db.each('SELECT column_name, udt_name, is_nullable, column_default IS NOT NULL as has_default ' +
                                'FROM information_schema.columns ' +
                                'WHERE table_name = $1 and table_schema = $2', [tableName, tableSchema], function (schemaItem) {
                                var column_name = schemaItem.column_name;
                                var columnComment = comments[column_name];
                                var foreignKey = fkeys[column_name];
                                tableDefinition.columns[column_name] = __assign(__assign({ udtName: schemaItem.udt_name, nullable: schemaItem.is_nullable === 'YES', hasDefault: schemaItem.has_default === true }, (columnComment ? { comment: columnComment } : {})), (foreignKey ? { foreignKey: foreignKey } : {}));
                            })];
                    case 2:
                        _b.sent();
                        return [2 /*return*/, tableDefinition];
                }
            });
        });
    };
    PostgresDatabase.prototype.getTableTypes = function (tableName, tableSchema, options) {
        return __awaiter(this, void 0, void 0, function () {
            var enumTypes, customTypes, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.getMeta(tableSchema)];
                    case 1:
                        enumTypes = (_c.sent()).enumTypes;
                        customTypes = lodash_1.default.keys(enumTypes);
                        _b = (_a = PostgresDatabase).mapTableDefinitionToType;
                        return [4 /*yield*/, this.getTableDefinition(tableName, tableSchema)];
                    case 2: return [2 /*return*/, _b.apply(_a, [_c.sent(), customTypes,
                            options])];
                }
            });
        });
    };
    PostgresDatabase.prototype.getSchemaTables = function (schemaName, prefixWithSchemaName) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.db.map('SELECT table_name ' +
                        'FROM information_schema.columns ' +
                        'WHERE table_schema = $1 ' +
                        'GROUP BY table_name ORDER BY lower(table_name)', [schemaName], 
                    /**
                     * Customisations added:
                     * - prefix table name with schemaName -> <schemaName>_<tableName>
                     */
                    function (schemaItem) {
                        return "".concat(prefixWithSchemaName ? "".concat(schemaName, "_") : '').concat(schemaItem.table_name);
                    })];
            });
        });
    };
    PostgresDatabase.prototype.getPrimaryKeys = function (schemaName) {
        return __awaiter(this, void 0, void 0, function () {
            var keys;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        return [4 /*yield*/, this.db.query("\n            SELECT\n                kcu.table_name,\n                tco.constraint_name,\n                kcu.ordinal_position as position,\n                kcu.column_name as key_column\n            FROM information_schema.table_constraints tco\n            JOIN information_schema.key_column_usage kcu\n                on kcu.constraint_name = tco.constraint_name\n                and kcu.constraint_schema = tco.constraint_schema\n                and kcu.constraint_name = tco.constraint_name\n            WHERE tco.constraint_type = 'PRIMARY KEY'\n              AND kcu.table_schema = $1\n            ORDER BY kcu.table_name,\n                     position;\n        ", [schemaName])];
                    case 1:
                        keys = _a.sent();
                        return [2 /*return*/, (0, lodash_1.default)(keys)
                                .groupBy(function (k) { return k.table_name; })
                                .mapValues(function (keysForTable) { return keysForTable[0].key_column; })
                                .value()];
                }
            });
        });
    };
    PostgresDatabase.prototype.getColumnComments = function (schemaName) {
        return __awaiter(this, void 0, void 0, function () {
            var comments;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        return [4 /*yield*/, this.db.query("\n            SELECT\n                c.table_name,\n                c.column_name,\n                pgd.description\n            FROM pg_catalog.pg_statio_all_tables AS st\n            INNER JOIN pg_catalog.pg_description pgd ON (pgd.objoid=st.relid)\n            INNER JOIN information_schema.columns c ON (\n                pgd.objsubid=c.ordinal_position AND\n                c.table_schema=st.schemaname AND\n                c.table_name=st.relname\n            )\n            WHERE c.table_schema = $1;\n        ", [schemaName])];
                    case 1:
                        comments = _a.sent();
                        return [2 /*return*/, (0, lodash_1.default)(comments)
                                .groupBy(function (c) { return c.table_name; })
                                .mapValues(function (ct) {
                                return lodash_1.default.fromPairs(ct.map(function (_a) {
                                    var column_name = _a.column_name, description = _a.description;
                                    return [column_name, description];
                                }));
                            })
                                .value()];
                }
            });
        });
    };
    PostgresDatabase.prototype.getTableComments = function (schemaName) {
        return __awaiter(this, void 0, void 0, function () {
            var comments;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        return [4 /*yield*/, this.db.query("\n            SELECT\n                t.table_name,\n                pgd.description\n            FROM pg_catalog.pg_statio_all_tables AS st\n            INNER JOIN pg_catalog.pg_description pgd ON (pgd.objoid=st.relid)\n            INNER JOIN information_schema.tables t ON (\n                t.table_schema=st.schemaname AND\n                t.table_name=st.relname\n            )\n            WHERE pgd.objsubid = 0\n              AND t.table_schema = $1;\n        ", [schemaName])];
                    case 1:
                        comments = _a.sent();
                        return [2 /*return*/, lodash_1.default.fromPairs(comments.map(function (c) { return [c.table_name, c.description]; }))];
                }
            });
        });
    };
    PostgresDatabase.prototype.getForeignKeys = function (schemaName) {
        return __awaiter(this, void 0, void 0, function () {
            var fkeys, countKey, colCounts;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        return [4 /*yield*/, this.db.query("\n        SELECT\n            cl2.relname AS table_name,\n            att2.attname AS column_name,\n            cl.relname AS foreign_table_name,\n            att.attname AS foreign_column_name,\n            conname\n        FROM\n            (SELECT\n                unnest(con1.conkey) AS \"parent\",\n                unnest(con1.confkey) AS \"child\",\n                con1.confrelid,\n                con1.conrelid,\n                con1.conname\n            FROM pg_class cl\n            JOIN pg_namespace ns ON cl.relnamespace = ns.oid\n            JOIN pg_constraint con1 ON con1.conrelid = cl.oid\n            WHERE ns.nspname = $1 AND con1.contype = 'f'\n            ) con\n        JOIN pg_attribute att ON att.attrelid = con.confrelid and att.attnum = con.child\n        JOIN pg_class cl ON cl.oid = con.confrelid\n        JOIN pg_class cl2 ON cl2.oid = con.conrelid\n        JOIN pg_attribute att2 ON att2.attrelid = con.conrelid AND att2.attnum = con.parent\n        ", [schemaName])];
                    case 1:
                        fkeys = _a.sent();
                        countKey = function (fk) { return "".concat(fk.table_name, ",").concat(fk.conname); };
                        colCounts = lodash_1.default.countBy(fkeys, countKey);
                        return [2 /*return*/, (0, lodash_1.default)(fkeys)
                                .filter(function (c) { return colCounts[countKey(c)] < 2; })
                                .groupBy(function (c) { return c.table_name; })
                                .mapValues(function (tks) {
                                return lodash_1.default.fromPairs(tks.map(function (ck) { return [
                                    ck.column_name,
                                    { table: ck.foreign_table_name, column: ck.foreign_column_name },
                                ]; }));
                            })
                                .value()];
                }
            });
        });
    };
    PostgresDatabase.prototype.getMeta = function (schemaName) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, enumTypes, tableToKeys, foreignKeys, columnComments, tableComments, metadata;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.metadata && schemaName === this.metadata.schema) {
                            return [2 /*return*/, this.metadata];
                        }
                        return [4 /*yield*/, Promise.all([
                                this.getEnumTypes(),
                                this.getPrimaryKeys(schemaName),
                                this.getForeignKeys(schemaName),
                                this.getColumnComments(schemaName),
                                this.getTableComments(schemaName),
                            ])];
                    case 1:
                        _a = _b.sent(), enumTypes = _a[0], tableToKeys = _a[1], foreignKeys = _a[2], columnComments = _a[3], tableComments = _a[4];
                        metadata = {
                            schema: schemaName,
                            enumTypes: enumTypes,
                            tableToKeys: tableToKeys,
                            foreignKeys: foreignKeys,
                            columnComments: columnComments,
                            tableComments: tableComments,
                        };
                        this.metadata = metadata;
                        return [2 /*return*/, metadata];
                }
            });
        });
    };
    PostgresDatabase.prototype.getDefaultSchema = function () {
        return 'public';
    };
    return PostgresDatabase;
}());
exports.PostgresDatabase = PostgresDatabase;
//# sourceMappingURL=schemaPostgres.js.map