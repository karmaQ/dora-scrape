import { pick } from "./picker"
import Typheous from "typheous"
import request from "./request"

import { isPlainObject,
         isFunction,
         defaultsDeep,
         includes,
         flatten,
         flattenDeep,
         isObject,
         isArray,
         toString,
         clone,
         mapKeys,
         uniq,
         castArray
       } from "lodash"

import {
  iterateLinks
} from "./utils"

class Scrape {
  constructor(seedUri, iterators, defaultRecipe, opts) {
    this.crawledLinks = []
    this.keepedLinks = []
    this.rules = {}
    this.saves = {}    
    // 设置默认值
    if(defaultRecipe) {
      this.defaulRecipe = defaultRecipe
    } else if (isPlainObject(iterators)) {
      this.defaulRecipe = iterators
      iterators = undefined
    }

    if(iterators) {
      this.links = iterateLinks(seedUri, iterators)
    } else {
      this.links = castArray(seedUri)
    }
    console.log(this.links)
    this.typheous = new Typheous()
  }

  scrape() {
    this.queue(this.links)
  }

  queue(links) {
    let queueLinks = links.map((x)=>{
      return {
        uri: x,
        processor: (error, opts)=>{ return request(opts) },
        after: this.after(x)
      }
    })
    console.info("queued:", links.length, "urls")
    this.typheous.queue(queueLinks)
  }

  on(rules, recipe) {
    rules = castArray(rules)
    rules.map(rl => {
      // TODO 当 recipe 为字符串时,从默认 recipe 列表中选取.
      this.rules[rl] = recipe
    })
    this.lastOn = rules
    if(includes(rules, "default")) {
      this.defaulRecipe = defaultsDeep(this.defaulRecipe,
                                       this.rules["default"])
    }
    return this
  }

  keep(callback) {
    this.doKeep = callback || ((x)=> {})
  }

  save(rules, callback) {
    if(isFunction(rules)) {
      callback = rules
      rules = this.lastOn || ["default"]
    }
    Array.isArray(rules) || (rules = [rules])
    rules.map(rl => this.saves[rl] = callback )
    return this
  }

  howSave(uri) {
    return this.getRules(uri,
                         this.saves,
                         recipes => flattenDeep(recipes)[0] )
  }

  howPipe(uri) {
    return this.getRules(uri, this.keeps, recipes => flatten(recipes))
  }

  howPick(uri) {
    return this.getRules(uri, this.rules, recipes => {
      return recipes.reduce((x, y) => {
        return defaultsDeep(x, y)
      }, {})
    })
  }

  getRules(uri, does, how) {
    let recipes = []
    // TODO 缓存 rules
    for(let r in does) {
      if(new RegExp(r).test(uri)) {
        recipes.push(does[r])
      }
    }
    if (does.default) {
      recipes.push(does.default)
    }
    return how(recipes)
  }

  pipe() {
    ;
  }

  processor() {
    ;
  }

  addLink(links) {
    this.queue(links)
  }

  after(uri) {
    let howPick = this.howPick(uri)
    let saver = this.howSave(uri)
    let linkAdder = this.addLink.bind(this)
    return function(res) {
      let [doc, $, links] = pick(res, howPick)
      if(links.length > 0)
        linkAdder(links)
      saver(doc, res, uri)
    }
  }
  
  use(fn) {
    fn(this)
    return this
  }  
}

export default Scrape
