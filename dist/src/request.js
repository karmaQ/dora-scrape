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
    return {
        text: yield request({
            method: 'GET',
            uri: opts.uri,
            timeout: 6000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36'
            }
        })
    };
});
//# sourceMappingURL=request.js.map