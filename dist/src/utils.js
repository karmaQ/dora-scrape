"use strict";
const lodash_1 = require("lodash");
exports.isBlank = (el) => {
    if (lodash_1.isString(el)) {
        return el.length == 0;
    }
    else if (lodash_1.isNumber(el)) {
        return false;
    }
    else {
        return lodash_1.isEmpty(el);
    }
};
exports.iterateLinks = (baseUri, iterators) => {
    let _iterators = [];
    for (let i in iterators) {
        _iterators.push([lodash_1.toString(i), iterators[i]]);
    }
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
    return lodash_1.uniq(lodash_1.flattenDeep(_makeLinks(baseUri, _iterators)));
};
//# sourceMappingURL=utils.js.map