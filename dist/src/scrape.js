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
const typheous_1 = require("typheous");
const request_1 = require("./request");
const lodash_1 = require("lodash");
const utils_1 = require("./utils");
class Scrape {
    constructor(seedUri, iterators, defaultRecipe, opts) {
        this.crawledLinks = [];
        this.keepedLinks = [];
        this.rules = {};
        this.thens = {};
        if (defaultRecipe) {
            this.defaulRecipe = defaultRecipe;
        }
        else if (lodash_1.isPlainObject(iterators)) {
            this.defaulRecipe = iterators;
            iterators = undefined;
        }
        if (iterators) {
            this.links = utils_1.iterateLinks(seedUri, iterators);
        }
        else if (seedUri) {
            this.links = lodash_1.castArray(seedUri);
        }
        else {
            this.links = [];
        }
        this.typheous = new typheous_1.default();
        this.request = request_1.default;
    }
    concat(links) {
        return this.links = this.links.concat(links);
    }
    scrape() {
        return this.queue(this.links);
    }
    queue(links, ctxIn) {
        return new Promise((resolve, reject) => {
            try {
                let queueLinks = links.map((x) => {
                    let uri = x.uri ? x.uri : x;
                    return {
                        uri: uri,
                        processor: (error, opts) => request_1.default(opts),
                        after: this.after(x, x.info, ctxIn),
                        onDrain: () => {
                            console.log("resolve");
                            resolve();
                        }
                    };
                });
                console.info("queued:", links.length, "urls");
                this.typheous.queue(queueLinks);
            }
            catch (error) {
                return reject(error);
            }
        });
    }
    on(rules, recipes) {
        rules = lodash_1.castArray(rules);
        rules.map(rl => {
            this.rules[rl] = recipes;
        });
        this.lastOn = rules;
        if (lodash_1.includes(rules, "default")) {
            this.defaulRecipe = lodash_1.defaultsDeep(this.defaulRecipe, this.rules["default"]);
        }
        return this;
    }
    keep(callback) {
        this.doKeep = callback || ((x) => { });
    }
    howPipe(uri) {
        return this.getRules(uri, this.keeps, recipes => lodash_1.flatten(recipes));
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
            let isMatch, uri = link.uri ? link.uri : link;
            if (lodash_1.isString(r)) {
                isMatch = lodash_1.includes(uri, r);
            }
            else if (lodash_1.isRegExp(r)) {
                isMatch = r.test(uri);
            }
            if (isMatch) {
                recipes.push(does[r]);
            }
        }
        if (does.default) {
            recipes.push(does.default);
        }
        return how(recipes);
    }
    pipe() {
        ;
    }
    processor() {
        ;
    }
    then(rules, callback) {
        if (lodash_1.isFunction(rules)) {
            callback = rules;
            rules = this.lastOn || ["default"];
        }
        Array.isArray(rules) || (rules = [rules]);
        rules.map(rl => {
            if (this.thens[rl]) {
                this.thens[rl].push(callback);
            }
            else {
                this.thens[rl] = lodash_1.castArray(callback);
            }
        });
        return this;
    }
    howThen(uri) {
        let theners = this.getRules(uri, this.thens, recipes => lodash_1.flattenDeep(recipes));
        return (doc, res, uri) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield theners.reduce((ret, thener) => __awaiter(this, void 0, void 0, function* () {
                    if (ret && ret.doc) {
                        yield thener(ret.doc, ret.res, ret.uri);
                    }
                    else {
                        yield thener(ret, doc, res, uri);
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
        return (res) => {
            let [doc, opts, follows] = picker_1.picker(res, howPick);
            if (opts.fields) {
                doc = lodash_1.pick(doc, opts.fields);
            }
            if (opts.except) {
                doc = lodash_1.omit(doc, opts.except);
            }
            doc = lodash_1.assign(ctxIh, ctx, doc);
            if (follows.length > 0) {
                if (opts.context) {
                    this.queue(follows, doc);
                }
                else {
                    this.queue(follows);
                }
            }
            thener && thener(doc, res, uri);
        };
    }
    use(fn) {
        fn(this);
        return this;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Scrape;
//# sourceMappingURL=scrape.js.map