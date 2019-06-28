"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var schemaPostgres_1 = require("./schemaPostgres");
// import { MysqlDatabase } from './schemaMysql'
var SQLVersion;
(function (SQLVersion) {
    SQLVersion[SQLVersion["POSTGRES"] = 1] = "POSTGRES";
    SQLVersion[SQLVersion["MYSQL"] = 2] = "MYSQL";
    SQLVersion[SQLVersion["UNKNOWN"] = 3] = "UNKNOWN";
})(SQLVersion || (SQLVersion = {}));
function getSQLVersion(connection) {
    if (/^postgres(ql)?:\/\//i.test(connection)) {
        return SQLVersion.POSTGRES;
    }
    else if (/^mysql:\/\//i.test(connection)) {
        return SQLVersion.MYSQL;
    }
    else {
        return SQLVersion.UNKNOWN;
    }
}
function getDatabase(connection) {
    switch (getSQLVersion(connection)) {
        // case SQLVersion.MYSQL:
        //   return new MysqlDatabase(connection)
        case SQLVersion.POSTGRES:
            return new schemaPostgres_1.PostgresDatabase(connection);
        default:
            throw new Error("SQL version unsupported in connection: " + connection);
    }
}
exports.getDatabase = getDatabase;
//# sourceMappingURL=schema.js.map