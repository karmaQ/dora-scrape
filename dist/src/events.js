"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const array_1 = require("lodash/fp/array");
const generic_pool_1 = require("generic-pool");
class CrawlEvent {
    constructor(opts) {
        this.options = {
            concurrency: 20,
            onDrain: false,
            priority: 5
        };
        this.pool = generic_pool_1.default({
            name: 'pool',
            max: this.options.concurrency,
            priorityRange: 10,
            create: cb => cb(1),
            destroy: () => { }
        });
        this.queueItemSize = 0;
        this.plannedQueueCalls = 0;
        this.on('pool:release', opts => this.release(opts));
        this.on('pool:drain', opts => {
            if (opts.onDrain) {
                opts.onDrain();
            }
        });
    }
    release(opts) {
        this.queueItemSize -= 1;
        this.pool.release(opts._poolRerence);
        if (this.queueItemSize + this.plannedQueueCalls == 0) {
            this.emit('pool:drain');
        }
    }
    queue(opts) {
        if (array_1.default.isArray(opts))
            opts = [opts];
        opts.forEach(x => this.queuePush(x));
    }
    queuePush(options) {
        this.queueItemSize += 1;
        this.pool.acquire((error, poolReference) => __awaiter(this, void 0, void 0, function* () {
            opts._poolReference = poolReference;
            if (error) {
                console.error('pool acquire error:', error);
            }
            yield opts.run();
        }), opts.priority);
    }
}
//# sourceMappingURL=events.js.map