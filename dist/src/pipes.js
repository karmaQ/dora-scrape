"use strict";
const lodash_1 = require("lodash");
exports.numbers = (ret) => {
    return lodash_1.toNumber((ret || '').replace(/[^\d]/g, ''));
};
exports.trim = (text) => {
    text = (text || "");
    text = text.replace('&nbsp;', '');
    return text.replace(/[\s]+/g, "");
};
//# sourceMappingURL=pipes.js.map