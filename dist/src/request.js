"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const request = require("request-promise");
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (opts) => __awaiter(this, void 0, void 0, function* () {
    console.info("request:", opts.uri);
    opts.uri = encodeURI(opts.uri);
    console.log();
    return {
        text: yield request.get(opts.uri)
    };
});
//# sourceMappingURL=request.js.map