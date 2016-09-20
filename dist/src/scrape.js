"use strict";
const typheous_1 = require("typheous");
const request_1 = require("./request");
const picker_1 = require("./picker");
const lodash_1 = require("lodash");
class Scrape {
    constructor(seedUri, iterators, defaultRecipe, opts) {
        this.crawledLinks = [];
        this.keepedLinks = [];
        if (defaultRecipe) {
            this.defaulRecipe = defaultRecipe;
        }
        else if (lodash_1.isPlainObject(iterators)) {
            this.defaulRecipe = iterators;
        }
        this.links = [
            "http://www.ruby-china.com"
        ];
        this.rules = {};
        this.saves = {};
        let _iterators = [];
        iterators = [[4, 5, 6, 7], [1, 2, 3, 4, 5, 6]];
        for (let k in iterators) {
            _iterators.push([lodash_1.toString(k), iterators[k]]);
        }
        let links = this.makeLinks("http://www.h.com/?asd=${0}&sad=${1}", _iterators);
        let picker = new picker_1.default;
        this.picker = picker.pick.bind(picker);
        this.typheous = new typheous_1.default();
    }
    scrape() {
        this.queue(this.links);
    }
    makeLinks(baseUri, iterators) {
        let _makeLinks = (baseUri, iterators) => {
            let its = iterators.pop();
            let links = its[1].map(it => {
                return baseUri.replace("${" + its[0] + "}", it);
            });
            if (iterators.length == 0) {
                return links;
            }
            else {
                return links.map(link => {
                    return _makeLinks(link, lodash_1.clone(iterators));
                });
            }
        };
        return lodash_1.flattenDeep(_makeLinks(baseUri, iterators));
    }
    queue(links) {
        let queueLinks = links.map((x) => {
            return {
                uri: x,
                processor: (error, opts) => { return request_1.default(opts); },
                after: this.after(x)
            };
        });
        console.info("queued:", links.length, "urls");
        this.typheous.queue(queueLinks);
    }
    on(rules, recipe) {
        Array.isArray(rules) || (rules = [rules]);
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
        let picker = this.picker;
        let saver = this.howSave(uri);
        let linkAdder = this.addLink.bind(this);
        return function (res) {
            let [doc, $, links] = picker(res, howPick);
            if (links.length > 0)
                linkAdder(links);
            saver(doc, res, uri);
        };
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Scrape;
//# sourceMappingURL=scrape.js.map