"use strict";
exports.iterateLinks = (baseUri, iterators) => {
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
                return _makeLinks(link, clone(iterators));
            });
        }
    };
    return flattenDeep(_makeLinks(baseUri, iterators));
};
//# sourceMappingURL=utils.js.map