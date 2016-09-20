"use strict";
const lodash_1 = require("lodash");
exports.numbers = (ret) => {
    return lodash_1.toNumber(ret.replace(/[^\d]/g, ''));
};
//# sourceMappingURL=pipes.js.map