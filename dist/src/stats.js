"use strict";
class Stat {
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (scrape) => {
    if (scrape.$isStats) {
        return;
    }
    scrape.stats = {};
    scrape.$isStat = true;
};
//# sourceMappingURL=stats.js.map