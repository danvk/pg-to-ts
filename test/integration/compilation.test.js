"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
var testUtility_1 = require("../testUtility");
describe('end user use case', function () {
    it('usecase.ts should compile without error', function () {
        testUtility_1.compile(['fixture/usecase.ts'], {
            noEmitOnError: true,
            noImplicitAny: true,
            target: ts.ScriptTarget.ES5,
            module: ts.ModuleKind.CommonJS
        });
    });
});
//# sourceMappingURL=compilation.test.js.map