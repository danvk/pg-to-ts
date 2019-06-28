"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var assert = require("assert");
var schema_1 = require("../../src/schema");
describe('Schema', function () {
    describe('getDatabase', function () {
        it('invalid connection', function () {
            try {
                schema_1.getDatabase('mongodb://localhost:27017');
            }
            catch (e) {
                assert.equal(e.message, 'SQL version unsupported in connection: mongodb://localhost:27017');
            }
        });
        it('mysql connection', function () {
            var db = schema_1.getDatabase('mysql://user:password@localhost/test');
            assert.equal(db.constructor.name, 'MysqlDatabase');
        });
        it('postgres connection', function () {
            var db = schema_1.getDatabase('postgres://user:password@localhost/test');
            assert.equal(db.constructor.name, 'PostgresDatabase');
        });
    });
});
//# sourceMappingURL=schema.test.js.map