"use strict";
/**
 * Generate typescript interface from table schema
 * Created by xiamx on 2016-08-10.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateEnumType = exports.generateTableInterface = exports.quoteForeignKeyMap = exports.quoteNullable = exports.quotedArray = exports.toCamelCase = exports.normalizeName = void 0;
//tslint:disable
var lodash_1 = __importDefault(require("lodash"));
function nameIsReservedKeyword(name) {
    var reservedKeywords = ['string', 'number', 'package', 'public'];
    return reservedKeywords.indexOf(name) !== -1;
}
function normalizeName(name) {
    if (nameIsReservedKeyword(name)) {
        return name + '_';
    }
    else {
        return name;
    }
}
exports.normalizeName = normalizeName;
function toCamelCase(name) {
    return name
        .split('_')
        .map(function (word) { return (word ? word[0].toUpperCase() + word.slice(1) : ''); })
        .join('');
}
exports.toCamelCase = toCamelCase;
function quotedArray(xs) {
    return '[' + xs.map(function (x) { return "'".concat(x, "'"); }).join(', ') + ']';
}
exports.quotedArray = quotedArray;
function quoteNullable(x) {
    return x === null || x === undefined ? 'null' : "'".concat(x, "'");
}
exports.quoteNullable = quoteNullable;
function quoteForeignKeyMap(x) {
    var colsTs = lodash_1.default.map(x, function (v, k) { return "".concat(k, ": { table: '").concat(v.table, "', column: '").concat(v.column, "' },"); });
    return '{' + colsTs.join('\n  ') + '}';
}
exports.quoteForeignKeyMap = quoteForeignKeyMap;
var JSDOC_TYPE_RE = /@type \{([^}]+)\}/;
function isNonNullish(x) {
    return x !== null && x !== undefined;
}
/** Returns [Table TypeScript, set of TS types to import] */
function generateTableInterface(tableNameRaw, tableDefinition, options) {
    var tableName = options.transformTypeName(tableNameRaw);
    var selectableMembers = '';
    var insertableMembers = '';
    var columns = [];
    var requiredForInsert = [];
    var typesToImport = new Set();
    for (var _i = 0, _a = Object.keys(tableDefinition.columns); _i < _a.length; _i++) {
        var columnNameRaw = _a[_i];
        var columnName = options.transformColumnName(columnNameRaw), columnDef = tableDefinition.columns[columnNameRaw], comment_1 = columnDef.comment, possiblyOrNull = columnDef.nullable ? ' | null' : '', insertablyOptional = columnDef.nullable || columnDef.hasDefault ? '?' : '', jsdoc_1 = comment_1 ? "/** ".concat(comment_1, " */\n") : '';
        var tsType = columnDef.tsType;
        if (tsType === 'Json' && options.options.jsonTypesFile && comment_1) {
            var m = JSDOC_TYPE_RE.exec(comment_1);
            if (m) {
                tsType = m[1].trim();
                typesToImport.add(tsType);
            }
        }
        selectableMembers += "".concat(jsdoc_1).concat(columnName, ": ").concat(tsType).concat(possiblyOrNull, ";\n");
        insertableMembers += "".concat(jsdoc_1).concat(columnName).concat(insertablyOptional, ": ").concat(tsType).concat(possiblyOrNull, ";\n");
        columns.push(columnName);
        if (!columnDef.nullable && !columnDef.hasDefault) {
            requiredForInsert.push(columnName);
        }
    }
    var normalizedTableName = normalizeName(tableName);
    var camelTableName = toCamelCase(normalizedTableName);
    var primaryKey = tableDefinition.primaryKey, comment = tableDefinition.comment;
    var foreignKeys = lodash_1.default.pickBy(lodash_1.default.mapValues(tableDefinition.columns, function (c) { return c.foreignKey; }), isNonNullish);
    var jsdoc = comment ? "/** ".concat(comment, " */\n") : '';
    return [
        "\n      // Table ".concat(tableName, "\n      ").concat(jsdoc, " export interface ").concat(camelTableName, " {\n        ").concat(selectableMembers, "}\n      ").concat(jsdoc, " export interface ").concat(camelTableName, "Input {\n        ").concat(insertableMembers, "}\n      const ").concat(normalizedTableName, " = {\n        tableName: '").concat(tableName, "',\n        columns: ").concat(quotedArray(columns), ",\n        requiredForInsert: ").concat(quotedArray(requiredForInsert), ",\n        primaryKey: ").concat(quoteNullable(primaryKey), ",\n        foreignKeys: ").concat(quoteForeignKeyMap(foreignKeys), ",\n      } as const;\n  "),
        typesToImport,
    ];
}
exports.generateTableInterface = generateTableInterface;
function generateEnumType(enumObject, options) {
    var enumString = '';
    for (var enumNameRaw in enumObject) {
        var enumName = options.transformTypeName(enumNameRaw);
        enumString += "export type ".concat(enumName, " = ");
        enumString += enumObject[enumNameRaw]
            .map(function (v) { return "'".concat(v, "'"); })
            .join(' | ');
        enumString += ';\n';
    }
    return enumString;
}
exports.generateEnumType = generateEnumType;
//# sourceMappingURL=typescript.js.map