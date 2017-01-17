"use strict";
const router_1 = require("./v2/dispatcher/router");
const lexer_1 = require("./v2/dispatcher/lexer");
let r = new router_1.default(/news\/([0-9]+)$/, function (x) {
    console.log('x:', x);
}, 0, {
    lexer: new lexer_1.default
});
console.log(r.match('/news/123123'));
r.matched.dispatch.apply(r.matched, r.getParamsArray('news/123123'));
//# sourceMappingURL=indexv2.js.map