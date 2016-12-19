"use strict";
const cheerio = require("cheerio");
const lodash_1 = require("lodash");
const object = require("lodash/fp/object");
const pipes = require("./pipes");
const to_html_1 = require("./to_html");
let mapValuesWithKey = object.mapValues.convert({ 'cap': false });
const utils_1 = require("./utils");
const reserved = ['follow', 'xpath', 'sels', 'keep',
    'attrs', 'how', 'convert', 'pipes',
    'flatten', 'context'];
function followLinks(ret, recipe, urikey) {
    if (!ret) {
        return [];
    }
    let links = [];
    let makeLink = (link, info) => {
        return recipe.context ? link : { uri: link, info: info };
    };
    if (lodash_1.isString(recipe.follow)) {
        let _ret = lodash_1.castArray(ret);
        _ret.map((item) => {
            try {
                let url = lodash_1.get(item, recipe.follow);
                if (url) {
                    links.push(makeLink(url, item));
                }
            }
            catch (e) {
                console.log(e);
            }
        });
    }
    else {
        links.push(makeLink(ret, { [urikey]: ret }));
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
        ret = lodash_1.isFunction(recipe.convert) ? recipe.convert(ret) : ret;
    }
    else {
        ret = html($, recipe);
    }
    if (lodash_1.isString(recipe.pipes)) {
        recipe.pipes = recipe.pipes.replace(/\s+/g, '');
        let rpipes = recipe.pipes.split('|');
        ret = rpipes.reduce((a, b) => { return pipes[b](a); }, ret);
    }
    return utils_1.isBlank(ret) ? recipe.default : ret;
}
function html($, recipe) {
    if (lodash_1.isString(recipe)) {
        recipe = { sels: recipe };
    }
    let sel = recipe.sels;
    let subs = lodash_1.omit(recipe, reserved);
    if (lodash_1.includes(sel, '::')) {
        let eqAttr;
        [sel, eqAttr] = lodash_1.split(sel, "::");
        eqAttr = lodash_1.toNumber(eqAttr) || eqAttr;
        if (lodash_1.isNumber(eqAttr) || eqAttr == '0') {
            recipe.eq = eqAttr;
        }
        else {
            recipe.attrs = lodash_1.includes(eqAttr, '&') ? lodash_1.split(eqAttr, '&') : eqAttr;
        }
    }
    if (lodash_1.includes(sel, 'meta')) {
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
    if (subs.length > 0 || (lodash_1.keys(subs)).length > 0) {
        let subHow = function ($elm) {
            let ret = {};
            if ($elm.find) {
                $elm = $elm.find.bind($elm);
            }
            for (var key in subs) {
                ret[key] = line($elm, subs[key]);
            }
            return ret;
        };
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
        ret = lodash_1.isFunction(recipe.convert) ? recipe.convert(ret) : ret;
        return ret;
    };
    if (lodash_1.includes(sel, '**')) {
        sel = lodash_1.split(sel, '**')[0];
        let ret = [];
        if (sel.length > 0) {
            $(sel).each((i, elm) => ret.push(getElm($(elm))));
        }
        else {
            $.root().children().each((i, elm) => ret.push(getElm($(elm))));
        }
        return ret;
    }
    else {
        let $elm = sel ? $(sel) : $;
        if (lodash_1.isNumber(recipe.eq) || recipe.eq == '0') {
            $elm = $elm.eq(recipe.eq);
        }
        return getElm($elm);
    }
}
exports.html = html;
function byJson(text, recipe, opts, res) {
    try {
        let json = JSON.parse(text);
        text = to_html_1.toHtml(json);
    }
    catch (error) {
        console.log(res.uri);
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
            links.push(followLinks(ret, rcp, k));
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
            return byJson(text, recipe, opts, res);
        case 'html':
            return byHtml(text, recipe, opts);
        case 'raw':
            return [{ body: text }, opts, []];
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