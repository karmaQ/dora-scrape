"use strict";
const cheerio = require("cheerio");
const lodash_1 = require("lodash");
const object = require("lodash/fp/object");
const pipes = require("./pipes");
const to_html_1 = require("./to_html");
let mapValuesWithKey = object.mapValues.convert({ 'cap': false });
const utils_1 = require("./utils");
function followLinks(ret, recipe) {
    if (!ret) {
        return [];
    }
    let links = [];
    let getVal = (item, path) => {
        return path.reduce((r, k) => { return r[k]; }, item);
    };
    let makeLink = (link, info) => {
        return recipe.context ? { uri: link, info: info } : link;
    };
    if (lodash_1.isString(recipe.follow)) {
        let _ret = lodash_1.isArray(ret) ? ret : [ret];
        let path = lodash_1.split(recipe.follow, ".");
        _ret.map((x) => {
            try {
                links.push(makeLink(getVal(x, path), x));
            }
            catch (e) {
                console.log(e);
            }
        });
    }
    else if (recipe) {
        links.push(makeLink(ret));
    }
    else {
        links.push(makeLink(ret));
    }
    return links;
}
function line($, recipe) {
    if (lodash_1.isString(recipe) || lodash_1.isArray(recipe) || lodash_1.isRegExp(recipe)) {
        recipe = { sels: recipe };
    }
    else {
        recipe = lodash_1.clone(recipe);
    }
    let ret = null, selectors = null;
    if (lodash_1.isString(recipe.sels)) {
        ret = html($, recipe);
    }
    else if (lodash_1.isArray(recipe.sels)) {
        let selectors = recipe.sels;
        for (let sel of selectors) {
            recipe.sels = sel;
            ret = html($, recipe);
            if (!utils_1.isBlank(ret)) {
                break;
            }
        }
    }
    else if (lodash_1.isRegExp(recipe.sels)) {
        ret = $.html().match(recipe.sels);
    }
    else {
        ret = null;
    }
    return utils_1.isBlank(ret) ? recipe.default : ret;
}
function html($, recipe) {
    if (lodash_1.isString(recipe)) {
        recipe = { sels: recipe };
    }
    let sel = recipe.sels;
    if (lodash_1.includes(sel, '::')) {
        let eqAttr;
        [sel, eqAttr] = lodash_1.split(sel, "::");
        eqAttr = lodash_1.toNumber(eqAttr) || eqAttr;
        if (lodash_1.isNumber(eqAttr)) {
            recipe.eq = eqAttr;
        }
        else {
            recipe.attrs = lodash_1.includes(eqAttr, '&') ? lodash_1.split(eqAttr, '&') : eqAttr;
        }
    }
    if (sel.indexOf("meta") >= 0) {
        recipe.attrs = recipe.attrs || "content";
    }
    if (recipe.attrs) {
        if (lodash_1.isString(recipe.attrs)) {
            recipe.how = ($e) => $e.attr(recipe.attrs);
        }
        else if (lodash_1.isArray(recipe.attrs)) {
            recipe.how = ($e) => {
                let ret = {};
                recipe.attrs.map((x) => {
                    let [xa, xn] = lodash_1.split(x, ':');
                    ret[xn || xa] = xa == "text" ? $e.text() : $e.attr(xa);
                });
                return ret;
            };
        }
    }
    if (recipe.subs) {
        let subHow;
        if (recipe.subs.sels) {
            subHow = function ($elm) {
                return line($elm.find.bind($elm), recipe.subs);
            };
        }
        else {
            subHow = function ($elm) {
                let ret = {};
                for (var key in recipe.subs) {
                    ret[key] = line($elm.find.bind($elm), recipe.subs[key]);
                }
                return ret;
            };
        }
        recipe.how = subHow;
    }
    recipe.how = recipe.how || "text";
    let getElm = ($elm) => {
        let ret;
        if (lodash_1.isFunction(recipe.how)) {
            let how = recipe.how.bind({
                get: (r) => line($elm.find.bind($elm), r),
                sels: recipe.sels
            });
            ret = how($elm);
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
function byJson(text, recipe, opts) {
    try {
        let json = JSON.parse(text);
        text = to_html_1.toHtml(json);
    }
    catch (error) {
        console.log(error);
        return null;
    }
    return byHtml(text, recipe, opts);
}
exports.byJson = byJson;
function toXml(json) {
}
exports.toXml = toXml;
function byHtml(text, recipe, opts) {
    let $, links = [], flattenLines = [];
    if (lodash_1.isString(text)) {
        $ = cheerio.load(text, { decodeEntities: false });
    }
    let doc = mapValuesWithKey((rcp, k) => {
        let ret = line($, rcp);
        if (rcp.follow) {
            links.push(followLinks(ret, rcp));
        }
        if (rcp.flatten) {
            flattenLines.push(k);
        }
        return ret;
    }, recipe);
    flattenLines.map(x => {
        lodash_1.assign(doc, doc[x]);
        delete (doc[x]);
    });
    return [doc, opts, lodash_1.flattenDeep(links).filter(x => x)];
}
exports.byHtml = byHtml;
function picker(res, recipe) {
    let text = res.text || "";
    let opts = lodash_1.clone(recipe.options) || {};
    delete (recipe.options);
    if (lodash_1.isString(opts.pre)) {
        recipe.pipes = recipe.pipes.replace(/\s+/g, '');
        let rpipes = recipe.pipes.split('|');
        text = rpipes.reduce((a, b) => { return pipes[b](a); }, text);
    }
    else if (lodash_1.isFunction(opts.pre)) {
        text = opts.pre(text);
    }
    switch (opts.format) {
        case 'json':
            return byJson(text, recipe, opts);
        case 'html':
            return byHtml(text, recipe, opts);
        case 'string':
            return text;
        default:
            if (text.match(/^\s*</)) {
                return byHtml(text, recipe, opts);
            }
            else if (text.match(/^\s*{/)) {
                return byJson(text, recipe, opts);
            }
            else {
                return byHtml(text, recipe, opts);
            }
    }
}
exports.picker = picker;
//# sourceMappingURL=picker.js.map