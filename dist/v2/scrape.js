"use strict";
const typhoeus_1 = require("typhoeus");
const lodash_1 = require("lodash");
class scrape {
    constructor(opts) {
        this.crawledLinks = [];
        this.typheous = new typhoeus_1.default(lodash_1.defaults(opts, {
            concurrency: 10,
            gap: null,
            onDrain: () => {
                console.log("resolved & drained");
            }
        }));
    }
    get(url, iterators, recipe) {
    }
    queue(links, opts) {
        links = lodash_1.castArray(links);
    }
    on() {
    }
    includes() {
    }
    use(fn) {
        fn(this);
        return this;
    }
}
//# sourceMappingURL=scrape.js.map