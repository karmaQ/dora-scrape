"use strict";
const cheerio = require("cheerio");
const lodash_1 = require("lodash");
const object = require("lodash/fp/object");
const isBlank = (el) => {
    if (lodash_1.isString(el)) {
        return el.length == 0;
    }
    else {
        return lodash_1.isEmpty(el);
    }
};
class Picker {
    constructor() {
        ;
        ;
    }
    pick(res, opts) {
        let text = res.text || "";
        if (text.match(/^\s*</)) {
            return this.byHtml(text, opts);
        }
        else if (text.match(/^\s*{/)) {
            return this.byJson(text, opts);
        }
        else {
            return this.byHtml(text, opts);
        }
    }
    byHtml(text, opts) {
        let $, links = [];
        if (lodash_1.isString(text)) {
            $ = cheerio.load(text, { decodeEntities: false });
        }
        let doc = object.mapValues(recipe => {
            let ret = this.line($, recipe);
            if (recipe.keep) {
                links.push(this.keepLinks(ret, recipe));
            }
            return ret;
        }, opts);
        return [doc, $, lodash_1.flattenDeep(links).filter(x => x)];
    }
    keepLinks(ret, recipe) {
        let links = [];
        let getVal = (item, path) => {
            return path.reduce((r, k) => { return r[k]; }, item);
        };
        if (lodash_1.isString(recipe.keep)) {
            let _ret = lodash_1.isArray(ret) ? ret : [ret];
            let path = lodash_1.split(recipe.keep, ".");
            _ret.map((x) => {
                try {
                    links.push(getVal(x, path));
                }
                catch (e) {
                }
            });
        }
        else if (recipe) {
            links.push(ret);
        }
        else {
            links.push(ret);
        }
        return links;
    }
    line($, recipe) {
        if (lodash_1.isString(recipe) || lodash_1.isArray(recipe) || lodash_1.isRegExp(recipe)) {
            recipe = { selector: recipe };
        }
        else {
            recipe = lodash_1.clone(recipe);
        }
        let ret = null, selectors = null;
        if (lodash_1.isString(recipe.selector)) {
            ret = this.html($, recipe);
        }
        else if (lodash_1.isArray(recipe.selector)) {
            let selectors = recipe.selector;
            for (let sel of selectors) {
                recipe.selector = sel;
                ret = this.html($, recipe);
                if (!isBlank(ret)) {
                    break;
                }
            }
        }
        else if (lodash_1.isRegExp(recipe.selector)) {
            ret = $.html().match(recipe.selector);
        }
        else {
            ret = null;
        }
        return isBlank(ret) ? recipe.default : ret;
    }
    html($, recipe) {
        let sel = recipe.selector;
        if (lodash_1.includes(sel, '::')) {
            let eqAttr = lodash_1.toNumber(lodash_1.split(sel, "::")[1]);
            sel = recipe.selector.split("::")[0];
            if (lodash_1.isNumber(eqAttr)) {
                recipe.eq = eqAttr;
            }
            else {
                recipe.attr = eqAttr;
            }
        }
        if (sel.indexOf("meta") >= 0) {
            recipe.attr = recipe.attr || "content";
        }
        if (recipe.attr) {
            recipe.how = ($e) => $e.attr(recipe.attr);
        }
        if (recipe.attrs) {
            recipe.how = ($e) => {
                let ret = {};
                recipe.attrs.map((x) => {
                    let [xa, xn] = lodash_1.split(x, ':');
                    ret[xn || xa] = xa == "text" ? $e.text() : $e.attr(xa);
                });
                return ret;
            };
        }
        recipe.how = recipe.how || "text";
        let getElm = ($elm) => {
            let ret;
            if (lodash_1.isFunction(recipe.how)) {
                ret = recipe.how($elm);
            }
            else {
                if ($elm[recipe.how]) {
                    ret = $elm[recipe.how]();
                }
            }
            ret = lodash_1.isFunction(recipe.convert) ? recipe.convert(ret) : ret;
            return ret;
        };
        if (lodash_1.includes(sel, '**')) {
            sel = lodash_1.split(sel, '**')[0];
            let ret = [];
            $(sel).each((i, elm) => ret.push(getElm($(elm))));
            return ret;
        }
        else {
            let $elm = $(sel);
            if (lodash_1.isNumber(recipe.eq)) {
                $elm = $elm.eq(recipe.eq);
            }
            return getElm($elm);
        }
    }
    byJson(text, opts) {
        return text;
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Picker;
//# sourceMappingURL=picker.js.map