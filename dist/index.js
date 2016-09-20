"use strict";
const scrape_1 = require("./src/scrape");
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = (uri, iterators, opts) => {
  return new scrape_1.default(uri, iterators, opts);
};
let s = new scrape_1.default("www.baidu.com");
s.on("ruby-china.com[/]?$", {
  categorys: {
    selector: ".panel-body .node-list a**",
    attrs: ["text:标题", "href:链接"],
    convert(elm) {
      elm["链接"] = "http://www.ruby-china.com" + elm["链接"];
      return elm;
    },
    node: ".node-list .node a**",
    keep: "链接",
    pipe: '',
    filter: ''
  }
}).save((doc) => {
  console.log(doc);
}).on("default", {
  title: "title",
  next_page: {
    selector: ".next_page a",
    attr: "href",
    convert: (x) => {
      if (x && x.length > 0)
        return "http://www.ruby-china.org" + x;
      else
        return null;
    },
    keep: true
  }
}).save((doc) => {
  console.log(doc);
});
let ret = s.scrape();
//# sourceMappingURL=index.js.map