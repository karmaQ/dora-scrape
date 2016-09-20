"use strict";
const superagent_1 = require("superagent");
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (opts) => {
    let req = superagent_1.default(opts.method, opts.uri);
    opts.heads = opts.head || {};
    opts.gzip && req.set('Accept-Encoding', 'gzip, deflate');
    opts.formData && req.send(opts.formData);
    opts.uri.query && req.query(opts.uri.query);
    opts.accept && req.accept(opts.accept);
    opts.cors && req.withCredentials();
    opts.auth && req.auth(opts.auth.user, opts.auth.pwd);
    for (let [hk, hv] of (opts.attachs || [])) {
        req.attach(hk, hv);
    }
    for (let [hk, hv] of opts.heads) {
        req.set(hk, hv);
    }
    return req;
};
//# sourceMappingURL=fetch.js.map