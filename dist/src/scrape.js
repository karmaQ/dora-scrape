"use strict";
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
        this.saves = {};
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
        else {
            this.links = lodash_1.castArray(seedUri);
        }
        this.typheous = new typheous_1.default();
    }
    scrape() {
        return this.queue(this.links);
    }
    queue(links) {
        let resolve, reject;
        let drain = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        try {
            let queueLinks = links.map((x) => {
                return {
                    uri: x,
                    processor: (error, opts) => request_1.default(opts),
                    after: this.after(x),
                    onDrain: () => { resolve(); }
                };
            });
            console.info("queued:", links.length, "urls");
            this.typheous.queue(queueLinks);
        }
        catch (error) {
            reject(error);
        }
        return drain;
    }
    on(rules, recipe) {
        rules = lodash_1.castArray(rules);
        rules.map(rl => {
            this.rules[rl] = recipe;
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
    save(rules, callback) {
        if (lodash_1.isFunction(rules)) {
            callback = rules;
            rules = this.lastOn || ["default"];
        }
        Array.isArray(rules) || (rules = [rules]);
        rules.map(rl => this.saves[rl] = callback);
        return this;
    }
    howSave(uri) {
        return this.getRules(uri, this.saves, recipes => lodash_1.flattenDeep(recipes)[0]);
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
    getRules(uri, does, how) {
        let recipes = [];
        for (let r in does) {
            if (new RegExp(r).test(uri)) {
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
    addLink(links) {
        this.queue(links);
    }
    after(uri) {
        let howPick = this.howPick(uri);
        let saver = this.howSave(uri);
        let linkAdder = this.addLink.bind(this);
        return function (res) {
            let [doc, $, links] = picker_1.pick(res, howPick);
            if (links.length > 0)
                linkAdder(links);
            saver(doc, res, uri);
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