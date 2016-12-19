"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const picker_1 = require("./picker");
const typhoeus_1 = require("typhoeus");
const request_1 = require("./request");
const lodash_1 = require("lodash");
const utils_1 = require("./utils");
class Scrape {
    constructor(seedUri, iterators, defaultRecipe, opts = {}) {
        this.crawledLinks = [];
        this.keepedLinks = [];
        this.rules = {};
        this.thens = {};
        if (iterators) {
            this.links = utils_1.iterateLinks(seedUri, iterators);
        }
        else if (seedUri) {
            this.links = lodash_1.castArray(seedUri);
        }
        else {
            this.links = [];
        }
        this.typheous = new typhoeus_1.default({
            concurrency: opts.concurrency || 10,
            gap: opts.gap || null,
            onDrain: () => {
                console.log("resolved & drained");
            }
        });
        this.request = request_1.default;
    }
    concat(links) {
        return this.links = this.links.concat(links);
    }
    scrape() {
        return this.queue(this.links);
    }
    queue(links, ctxIn) {
        let linkLength = links.length;
        let rets = [];
        return Promise.resolve(new Promise((resolve, reject) => {
            try {
                let queueLinks = links.map((x) => {
                    let uri = x.uri ? x.uri : x;
                    if (!lodash_1.includes(uri, 'http')) {
                        if (--linkLength == 0) {
                            resolve();
                        }
                        return null;
                    }
                    return {
                        uri: uri,
                        priority: x.priority || 5,
                        gap: x.gap || null,
                        processor: (error, opts) => request_1.default(opts),
                        release: (retval) => __awaiter(this, void 0, void 0, function* () {
                            let ret;
                            try {
                                ret = yield this.after(x, x.info, ctxIn)(retval);
                            }
                            catch (error) {
                                console.log(error);
                            }
                            rets.push(ret);
                            if (--linkLength == 0) {
                                resolve(rets);
                            }
                        }),
                        onError: (err) => {
                            console.log(err);
                        }
                    };
                });
                if (queueLinks.length == 0) {
                    resolve([]);
                }
                console.info("queued:", links.length, "urls");
                this.typheous.queue(queueLinks);
            }
            catch (error) {
                console.log('rejected');
                console.log(error);
                return reject(error);
            }
        }));
    }
    on(rules, recipes) {
        rules = lodash_1.castArray(rules);
        rules.map(rl => {
            if (lodash_1.isFunction(rl)) {
                let $rl = "$func$_" + lodash_1.keys(this.rules).length;
                this.rules[$rl] = {
                    on: rl,
                    does: recipes
                };
            }
            else {
                this.rules[rl] = recipes;
            }
        });
        this.lastOn = rules;
        if (lodash_1.includes(rules, "default")) {
            this.defaulRecipe = lodash_1.defaultsDeep(this.defaulRecipe, this.rules["default"]);
        }
        return this;
    }
    then(rules, callback) {
        if (lodash_1.isFunction(rules)) {
            callback = rules;
            rules = this.lastOn || ["default"];
        }
        rules = lodash_1.castArray(rules);
        rules.map(rl => {
            if (lodash_1.isFunction(rl)) {
                let $rl = "$func$_" + lodash_1.keys(this.rules).length;
                if (this.thens[$rl]) {
                    this.thens[$rl].does.push(callback);
                }
                else {
                    this.thens[$rl] = {
                        on: rl, does: [callback]
                    };
                }
            }
            else {
                if (!this.thens[rl]) {
                    this.thens[rl] = [];
                }
                this.thens[rl].push(callback);
            }
        });
        return this;
    }
    howPick(uri) {
        return this.getRules(uri, this.rules, recipes => {
            return recipes.reduce((x, y) => {
                return lodash_1.defaultsDeep(x, y);
            }, {});
        });
    }
    getRules(link, does, how) {
        let recipes = [];
        for (let r in does) {
            let isMatch, _do, uri = link.uri ? link.uri : link;
            if (lodash_1.startsWith(r, "$func$_")) {
                isMatch = does[r].on(uri, link);
                _do = does[r].does;
            }
            else if (lodash_1.startsWith(r, "$reg$_")) {
                isMatch = r.test(uri);
                _do = does[r];
            }
            else {
                isMatch = lodash_1.includes(uri, r);
                _do = does[r];
            }
            if (isMatch) {
                recipes.push(_do);
            }
        }
        if (does.default) {
            recipes.push(does.default);
        }
        return how(recipes);
    }
    processor() {
        ;
    }
    howThen(uri) {
        let theners = this.getRules(uri, this.thens, recipes => lodash_1.flattenDeep(recipes));
        return (doc, res, uri) => __awaiter(this, void 0, void 0, function* () {
            try {
                return yield theners.reduce((ret, thener) => __awaiter(this, void 0, void 0, function* () {
                    if (ret && ret.doc) {
                        return yield thener(ret.doc, ret.res, ret.uri);
                    }
                    else {
                        return yield thener(ret, doc, res, uri);
                    }
                }), { doc: doc, res: res, uri: uri });
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    save(rules, callback) {
        return this.then(rules, callback);
    }
    after(uri, ctx, ctxIh) {
        let howPick = this.howPick(uri);
        let thener = this.howThen(uri);
        return (res) => __awaiter(this, void 0, void 0, function* () {
            try {
                let [doc, opts, follows] = picker_1.picker(res, howPick);
                if (follows.length > 0) {
                    if (opts.context) {
                        yield this.queue(follows, lodash_1.assign(ctxIh, doc));
                    }
                    else {
                        yield this.queue(follows);
                    }
                }
                if (opts.fields) {
                    doc = lodash_1.pick(doc, opts.fields);
                }
                if (opts.except) {
                    doc = lodash_1.omit(doc, opts.except);
                }
                if (thener) {
                    return yield thener(lodash_1.assign(ctx, doc), res, uri);
                }
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    use(fn) {
        fn(this);
        return this;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Scrape;
//# sourceMappingURL=scrape.js.map