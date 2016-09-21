"use strict";
const cheerio = require("cheerio");
const lodash_1 = require("lodash");
const object = require("lodash/fp/object");
const pipes = require("./pipes");
const to_html_1 = require("./to_html");
let mapValuesWithKey = object.mapValues.convert({ 'cap': false });
const utils_1 = require("./utils");
function keepLinks(ret, recipe) {
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
function line($, recipe) {
    if (lodash_1.isString(recipe) || lodash_1.isArray(recipe) || lodash_1.isRegExp(recipe)) {
        recipe = { selector: recipe };
    }
    else {
        recipe = lodash_1.clone(recipe);
    }
    let ret = null, selectors = null;
    if (lodash_1.isString(recipe.selector)) {
        ret = html($, recipe);
    }
    else if (lodash_1.isArray(recipe.selector)) {
        let selectors = recipe.selector;
        for (let sel of selectors) {
            recipe.selector = sel;
            ret = html($, recipe);
            if (!utils_1.isBlank(ret)) {
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
    return utils_1.isBlank(ret) ? recipe.default : ret;
}
function html($, recipe) {
    let sel = recipe.selector;
    if (lodash_1.includes(sel, '::')) {
        let eqAttr;
        [sel, eqAttr] = lodash_1.split(sel, "::");
        eqAttr = lodash_1.toNumber(eqAttr);
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
        if (lodash_1.isString(recipe.pipes)) {
            recipe.pipes = recipe.pipes.replace(/\s+/g, '');
            let rpipes = recipe.pipes.split('|');
            ret = rpipes.reduce((a, b) => { return pipes[b](a); }, ret);
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
exports.html = html;
function byJson(text, opts) {
    try {
        let json = JSON.parse(text);
        let html = to_html_1.toHtml(json);
    }
    catch (error) {
        console.log(error);
        return null;
    }
    return byHtml(html, opts);
}
exports.byJson = byJson;
function toXml(json) {
}
exports.toXml = toXml;
function byHtml(text, opts) {
    let $, links = [], flattenLines = [];
    if (lodash_1.isString(text)) {
        $ = cheerio.load(text, { decodeEntities: false });
    }
    let doc = mapValuesWithKey((recipe, k) => {
        let ret = line($, recipe);
        if (recipe.keep) {
            links.push(keepLinks(ret, recipe));
        }
        if (recipe.flatten) {
            flattenLines.push(k);
        }
        return ret;
    }, opts);
    flattenLines.map(x => {
        lodash_1.assign(doc, doc[x]);
        delete (doc[x]);
    });
    return [doc, $, lodash_1.flattenDeep(links).filter(x => x)];
}
exports.byHtml = byHtml;
function pick(res, recipe) {
    let text = res.text || "";
    let opts = lodash_1.clone(recipe.options) || {};
    delete (recipe.options);
    switch (opts.format) {
        case 'json':
            return byJson(text, recipe);
        case 'html':
            return byHtml(text, recipe);
        case 'string':
            return text;
        default:
            if (text.match(/^\s*</)) {
                return byHtml(text, recipe);
            }
            else if (text.match(/^\s*{/)) {
                return byJson(text, recipe);
            }
            else {
                return byHtml(text, recipe);
            }
    }
}
exports.pick = pick;
//# sourceMappingURL=picker.js.map