"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const request = require("request");
const iconv_1 = require("iconv");
const charset = require("charset");
const jschardet = require("jschardet");
const lodash_1 = require("lodash");
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (opts) => __awaiter(this, void 0, void 0, function* () {
    console.info("request:", opts.uri);
    opts.uri = encodeURI(opts.uri);
    let text = yield new Promise(function (resolve, reject) {
        request({
            method: 'GET',
            uri: opts.uri,
            timeout: 6000,
            encoding: null,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36'
            }
        }, function (err, res, body) {
            if (err) {
                reject(err);
            }
            else {
                let result, buffer = body;
                let encoding = charset(res, buffer);
                encoding = encoding || jschardet.detect(buffer).encoding;
                if (encoding) {
                    console.info("Detecd charset", encoding);
                    if (lodash_1.includes(['ascii', 'urf'], encoding)) {
                        res.text = buffer.toString();
                    }
                    else {
                        let iconv = new iconv_1.Iconv(encoding, 'UTF-8//TRANSLIT//IGNORE');
                        res.text = iconv.convert(buffer).toString();
                    }
                }
                resolve(res.text);
            }
        });
    });
    return {
        text: text
    };
});
//# sourceMappingURL=request.js.map