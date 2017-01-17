"use strict";
class Oner {
    constructor(pattern, callback, prioity, router) {
        let isRegexPattern = isRegExp(pattern);
        let lexer = router.lexer;
        this.router = router;
        this.pattern = pattern;
        if (!isRegExp(pattern)) {
            this.paramsIds = lexer.getParamIds(pattern);
            this.optionalParamsIds = lexer.getOptionalParamsIds(pattern);
            this.matchRegexp = lexer.compilePattern(pattern, router.ignoreCase);
        }
        else {
            this.matchRegexp = pattern;
        }
        this.matched = new Signal();
        this.switched = new Signal();
        this.paramsIds = isRegexPattern ? null : lexer.getParamIds(pattern);
        if (callback) {
            this.matched.add(callback);
        }
        this.prioity = prioity || 0;
        this.greedy = false;
        this.rules = null;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Oner;
//# sourceMappingURL=oner.js.map